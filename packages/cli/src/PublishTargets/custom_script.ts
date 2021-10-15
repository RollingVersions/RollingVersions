import {dirname, resolve} from 'path';

import {execBuffered} from 'modern-spawn';
import * as toml from 'toml';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {
  CustomScriptTargetConfig,
  PackageManifest,
  PublishTarget,
  RollingConfigOptions,
} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import isObject from '../ts-utils/isObject';
import {PublishConfig} from '../types/publish';
import createPublishTargetAPI from './baseTarget';

const KEYS_TO_CONFIG: [keyof RollingConfigOptions, string][] = [
  ['baseVersion', 'base_version'],
  ['changeTypes', 'change_types'],
  ['tagFormat', 'tag_format'],
  ['versioningMode', 'versioning'],
  ['versionSchema', 'version_schema'],
];

const MANIFEST_NAME = 'rolling-package';
// TODO: better error messages
type ParseResult = {ok: true; value: unknown} | {ok: false; reason: string};
const failed = (reason: string): {ok: false; reason: string} => ({
  ok: false,
  reason,
});
const MANIFEST_EXTENSIONS = {
  '.json': (str: string): ParseResult => {
    try {
      return {ok: true, value: JSON.parse(str)};
    } catch (ex: any) {
      return failed(ex.message);
    }
  },
  '.toml': (str: string): ParseResult => {
    try {
      return {ok: true, value: toml.parse(str)};
    } catch (ex: any) {
      return failed(ex.message);
    }
  },
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

export default createPublishTargetAPI<CustomScriptTargetConfig>({
  type: PublishTarget.custom_script,
  pathMayContainPackage(filename) {
    return filenames.some((f) => filename === f || filename.endsWith(`/${f}`));
  },

  async getPackageManifest(
    path,
    content,
  ): Promise<
    {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
  > {
    const parseResult = parsePackage(path, content);
    if (!parseResult) return {ok: true, manifest: null};
    if (!parseResult.ok) return parseResult;

    const result = parseResult.value;

    if (!isObject(result)) {
      return failed(`Expected config to be an object`);
    }
    if (typeof result.name !== 'string') {
      return failed('Expected "name" to be a string');
    }

    if (!isObject(result.scripts)) {
      return failed('Expected "scripts" to be an object');
    }
    if (
      result.scripts.prepublish !== undefined &&
      typeof result.scripts.prepublish !== 'string'
    ) {
      return failed(
        'Expected "scripts"."prepublish" to be a string or undefined',
      );
    }

    if (
      result.scripts.publish_dry_run !== undefined &&
      typeof result.scripts.publish_dry_run !== 'string'
    ) {
      return failed(
        'Expected "scripts"."publish_dry_run" to be a string or undefined',
      );
    }

    if (typeof result.scripts.publish !== 'string') {
      return failed('Expected "scripts"."publish" to be a string');
    }

    if (
      result.dependencies !== undefined &&
      !(
        Array.isArray(result.dependencies) &&
        result.dependencies.every((value) => typeof value === 'string')
      )
    ) {
      return failed(
        'Expected "dependencies" to be undefined or an array of strings',
      );
    }

    const customized: (keyof RollingConfigOptions)[] = [];
    const rawConfig: any = {};
    for (const [configKey, pkgKey] of KEYS_TO_CONFIG) {
      const value = result[pkgKey];
      if (value !== undefined) {
        rawConfig[configKey] = value;
        customized.push(configKey);
      }
    }
    const config = parseRollingConfigOptions(rawConfig);

    if (!config.success) {
      let reason = config.reason;
      for (const [configKey, pkgKey] of KEYS_TO_CONFIG) {
        reason = reason.split(configKey).join(pkgKey);
      }
      return fail(reason);
    }

    return {
      ok: true,
      manifest: {
        packageName: result.name,
        ...config.value,
        customized,
        targetConfigs: [
          {
            type: PublishTarget.custom_script,
            path,
            prepublish: result.scripts.prepublish,
            publish_dry_run: result.scripts.publish_dry_run,
            publish: result.scripts.publish,
          },
        ],
        dependencies: {
          required: result.dependencies || [],
          optional: [],
          development: [],
        },
      },
    };
  },

  async prepublish(config, pkg, targetConfig, packageVersions) {
    const env = getEnv(config, pkg.newVersion, packageVersions);

    if (targetConfig.prepublish) {
      const result = await execBuffered(targetConfig.prepublish, {
        env,
        cwd: dirname(resolve(config.dirname, targetConfig.path)),
      });
      if (result.status) {
        return {ok: false, reason: result.stderr.toString('utf8')};
      }
    }

    return {ok: true};
  },

  async publish(config, pkg, targetConfig, packageVersions) {
    const env = getEnv(config, pkg.newVersion, packageVersions);
    if (config.dryRun) {
      if (targetConfig.publish_dry_run) {
        const result = await execBuffered(targetConfig.publish_dry_run, {
          env,
          debug: true,
        });
        // getResult throws if the command failed
        result.getResult();
      }
    } else {
      const result = await execBuffered(targetConfig.publish, {
        env,
        cwd: dirname(resolve(config.dirname, targetConfig.path)),
        debug: true,
      });
      // getResult throws if the command failed
      result.getResult();
    }
  },
});

function getEnv(
  config: PublishConfig,
  newVersion: VersionNumber,
  packageVersions: Map<string, VersionNumber | null>,
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

  env.NEW_VERSION = printString(newVersion);
  for (const [name, version] of packageVersions) {
    if (version !== null) {
      env[dependencyNameToEnvVar(name)] = printString(version);
    }
  }
  return env;
}
