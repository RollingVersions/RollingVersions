import {dirname, resolve} from 'path';
import * as toml from 'toml';
import {
  PackageManifest,
  PublishTarget,
  PublishConfig,
  PrePublishResult,
  PackageDependencies,
} from '../types';
import isObject from '../ts-utils/isObject';
import {execBuffered} from 'modern-spawn';

const MANIFEST_NAME = 'rolling-package';
// TODO: better error messages
const MANIFEST_EXTENSIONS = {
  '.json': (str: string): unknown => JSON.parse(str),
  '.toml': (str: string): unknown => toml.parse(str),
};
const filenames = Object.keys(MANIFEST_EXTENSIONS).map(
  (ext) => `${MANIFEST_NAME}${ext}`,
);

function dependencyNameToEnvVar(name: string) {
  return `DEPENDENCY_${name
    .replace(/\@/g, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toUpperCase()}`;
}

function parsePackage(path: string, content: string) {
  for (const [ext, parser] of Object.entries(MANIFEST_EXTENSIONS)) {
    if (path.endsWith(ext)) {
      return parser(content);
    }
  }
  return undefined;
}

/**
 * returns true for package.json files
 */
export function pathMayContainPackage(filename: string): boolean {
  return filenames.some((f) => filename === f || filename.endsWith(`/${f}`));
}

export async function getRegistryVersion(pkg: PackageManifest) {
  if (pkg.targetConfig.type !== PublishTarget.custom_script) {
    throw new Error('Expected custom script target config');
  }
  if (!pkg.targetConfig.version) return null;
  const result = await execBuffered(pkg.targetConfig.version, {
    // TODO: get correct dirname
    cwd: dirname(pkg.path),
  });
  return result.getResult('utf8').trim();
}

/**
 * Parses the JSON and returns all the package info except
 * the version tag.
 */
export async function getPackageManifest(
  path: string,
  content: string,
): Promise<{
  manifest: Omit<PackageManifest, 'versionTag'>;
  dependencies: PackageDependencies;
} | null> {
  let result: unknown;
  try {
    result = parsePackage(path, content);
  } catch (ex) {
    // ignore
  }

  if (isObject(result) && typeof result.name === 'string') {
    if (!isObject(result.scripts)) {
      throw new Error('Expected "scripts" to be an object');
    }

    if (
      result.scripts.version !== undefined &&
      typeof result.scripts.version !== 'string'
    ) {
      throw new Error(
        'Expected "scripts"."version" to be a string or undefined',
      );
    }

    if (
      result.scripts.prepublish !== undefined &&
      typeof result.scripts.prepublish !== 'string'
    ) {
      throw new Error(
        'Expected "scripts"."prepublish" to be a string or undefined',
      );
    }

    if (
      result.scripts.publish_dry_run !== undefined &&
      typeof result.scripts.publish_dry_run !== 'string'
    ) {
      throw new Error(
        'Expected "scripts"."publish_dry_run" to be a string or undefined',
      );
    }

    if (typeof result.scripts.publish !== 'string') {
      throw new Error('Expected "scripts"."publish" to be a string');
    }

    if (
      result.dependencies !== undefined &&
      !(
        Array.isArray(result.dependencies) &&
        result.dependencies.every((value) => typeof value === 'string')
      )
    ) {
      throw new Error(
        'Expected "publish"."dependencies" to be undefined or an array of strings',
      );
    }

    return {
      manifest: {
        packageName: result.name,
        path,
        notToBePublished: false,
        targetConfig: {
          type: PublishTarget.custom_script,
          version: result.scripts.version,
          prepublish: result.scripts.prepublish,
          publish_dry_run: result.scripts.publish_dry_run,
          publish: result.scripts.publish,
        },
      },
      dependencies: {
        required: result.dependencies || [],
        optional: [],
        development: [],
      },
    };
  } else {
    return null;
  }
}

function getEnv(
  config: PublishConfig,
  newVersion: string,
  packageVersions: Map<string, string | null>,
) {
  const env: {[key: string]: string | undefined} = {...process.env};
  if (config.canary) {
    env.CANARY = config.canary;
  }
  if (config.deployBranch) {
    env.DEPLOY_BRANCH = config.deployBranch;
  }
  if (config.dryRun) {
    env.DRY_RUN = 'TRUE';
  }
  env.GITHUB_REPOSITORY = `${config.owner}/${config.name}`;
  env.GITHUB_REPOSITORY_OWNER = config.owner;
  env.GITHUB_REPOSITORY_NAME = config.name;

  env.NEW_VERSION = newVersion;
  for (const [name, version] of packageVersions) {
    if (version !== null) {
      env[dependencyNameToEnvVar(name)] = version;
    }
  }
  return env;
}

export async function prepublish(
  config: PublishConfig,
  pkg: PackageManifest,
  newVersion: string,
  packageVersions: Map<string, string | null>,
): Promise<PrePublishResult> {
  if (pkg.targetConfig.type !== PublishTarget.custom_script) {
    throw new Error('Expected custom script target config');
  }
  const env = getEnv(config, newVersion, packageVersions);

  if (pkg.targetConfig.prepublish) {
    const result = await execBuffered(pkg.targetConfig.prepublish, {
      env,
      cwd: dirname(resolve(config.dirname, pkg.path)),
    });
    if (result.status) {
      return {ok: false, reason: result.stderr.toString('utf8')};
    }
  }

  return {ok: true};
}

export async function publish(
  config: PublishConfig,
  pkg: PackageManifest,
  newVersion: string,
  packageVersions: Map<string, string | null>,
) {
  if (pkg.targetConfig.type !== PublishTarget.custom_script) {
    throw new Error('Expected custom script target config');
  }
  const env = getEnv(config, newVersion, packageVersions);
  if (config.dryRun) {
    if (pkg.targetConfig.publish_dry_run) {
      const result = await execBuffered(pkg.targetConfig.publish_dry_run, {
        env,
        debug: true,
      });
      // getResult throws if the command failed
      result.getResult();
    }
  } else {
    const result = await execBuffered(pkg.targetConfig.publish, {
      env,
      cwd: dirname(resolve(config.dirname, pkg.path)),
      debug: true,
    });
    // getResult throws if the command failed
    result.getResult();
  }
}
