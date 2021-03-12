import {dirname, resolve} from 'path';

import {execBuffered} from 'modern-spawn';
import * as toml from 'toml';

import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import isObject from '../ts-utils/isObject';
import type {PublishConfig, PackageManifest} from '../types';
import {PublishTarget} from '../types';
import type {CustomScriptTargetConfig} from '../types/PublishTarget';
import createPublishTargetAPI from './baseTarget';

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

export default createPublishTargetAPI<CustomScriptTargetConfig>({
  type: PublishTarget.custom_script,
  pathMayContainPackage(filename) {
    return filenames.some((f) => filename === f || filename.endsWith(`/${f}`));
  },

  async getPackageManifest(path, content): Promise<PackageManifest | null> {
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
          'Expected "dependencies" to be undefined or an array of strings',
        );
      }

      if (
        result.tag_format !== undefined &&
        typeof result.tag_format !== 'string'
      ) {
        throw new Error('Expected "tag_format" to be undefined or a string');
      }
      return {
        packageName: result.name,
        tagFormat: result.tag_format,
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
      };
    } else {
      return null;
    }
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
