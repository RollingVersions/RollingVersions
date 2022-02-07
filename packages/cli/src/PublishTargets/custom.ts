import * as toml from 'toml';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {
  PackageManifest,
  PublishTarget,
  RollingConfigOptions,
} from '@rollingversions/types';

import isObject from '../ts-utils/isObject';
import createPublishTargetAPI, {cmd} from './baseTarget';

const CONFIG_KEYS: (keyof RollingConfigOptions)[] = [
  'base_version',
  'change_types',
  'tag_format',
  'versioning_mode',
  'version_schema',
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

function parsePackage(path: string, content: string) {
  for (const [ext, parser] of Object.entries(MANIFEST_EXTENSIONS)) {
    if (path.endsWith(ext)) {
      return parser(content);
    }
  }
  return undefined;
}

export default createPublishTargetAPI<PublishTarget.custom>({
  type: PublishTarget.custom,

  getPackageManifests(config, globalConfig) {
    return [
      {
        status: 'manifest',
        manifest: {
          ...globalConfig,
          packageName: config.name,
          targetConfigs: [
            {
              type: PublishTarget.custom,
              release_dry_run: cmd(config.scripts?.release_dry_run),
              release: cmd(config.scripts?.release),
            },
          ],
          dependencies: {
            required: config.dependencies || [],
            optional: [],
            development: [],
          },
        },
      },
    ];
  },

  legacyManifests: {
    pathMayContainPackage(filename) {
      return filenames.some(
        (f) => filename === f || filename.endsWith(`/${f}`),
      );
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
      const rawConfig: {
        -readonly [k in keyof RollingConfigOptions]?: unknown;
      } = {};
      for (const configKey of CONFIG_KEYS) {
        const value = result[configKey];
        if (value !== undefined) {
          rawConfig[configKey] = value;
          customized.push(configKey);
        }
      }
      if (rawConfig.versioning_mode === undefined) {
        const value = result.versioning;
        if (value !== undefined) {
          rawConfig.versioning_mode = value;
          customized.push(`versioning_mode`);
        }
      }
      const config = parseRollingConfigOptions(rawConfig);

      if (!config.success) {
        return failed(config.reason);
      }

      const directory = filenames
        .map((f) =>
          path === f
            ? ``
            : path.endsWith(`/${f}`)
            ? path.substring(0, path.length - `/${f}`.length)
            : undefined,
        )
        .find((p) => p !== undefined);
      const command = (command: string) => ({command, directory});
      return {
        ok: true,
        manifest: {
          packageName: result.name,
          ...config.value,
          customized,
          scripts: {
            pre_release: result.scripts.prepublish
              ? [command(result.scripts.prepublish)]
              : [],
            post_release: [],
          },
          targetConfigs: [
            {
              type: PublishTarget.custom,
              release_dry_run: result.scripts.publish_dry_run
                ? command(result.scripts.publish_dry_run)
                : undefined,
              release: result.scripts.publish
                ? command(result.scripts.publish)
                : undefined,
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
  },

  async prepublish() {
    return {ok: true};
  },

  async publish(config, _pkg, targetConfig, _packageVersions, executeCommand) {
    if (config.dryRun) {
      if (targetConfig.release_dry_run) {
        const result = await executeCommand(targetConfig.release_dry_run, {
          debug: true,
        });
        // getResult throws if the command failed
        result.getResult();
      }
    } else if (targetConfig.release) {
      const result = await executeCommand(targetConfig.release, {
        debug: true,
      });
      // getResult throws if the command failed
      result.getResult();
    }
  },
});
