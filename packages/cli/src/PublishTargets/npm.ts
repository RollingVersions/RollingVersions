import * as t from 'funtypes';
import {gt, prerelease} from 'semver';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {
  PackageManifest,
  PublishTarget,
  RollingConfigOptions,
} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import {deleteRepoFile, readRepoFile, writeRepoFile} from '../services/git';
import {getVersions, publish as npmPublish} from '../services/npm';
import isObject from '../ts-utils/isObject';
import {PublishConfig} from '../types/publish';
import createPublishTargetAPI, {GetManifestsResult} from './baseTarget';

const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline').graceful;
const stringifyPackage = require('stringify-package');

const KEYS_TO_CONFIG: [keyof RollingConfigOptions, string][] = [
  ['base_version', 'baseVersion'],
  ['change_types', 'changeTypes'],
  ['tag_format', 'tagFormat'],
  ['versioning_mode', 'versioningMode'],
  ['version_schema', 'versionSchema'],
];
function versionPrefix(oldVersion: string, {canary}: {canary: boolean}) {
  if (canary) return '';
  switch (oldVersion[0]) {
    case '^':
    case '~':
      return oldVersion[0];
    default:
      return '';
  }
}

async function withNpmVersion<T>(
  config: PublishConfig,
  target: {packageName: string; path: string},
  newVersion: string,
  packageVersions: Map<string, VersionNumber | null>,
  fn: () => Promise<T>,
) {
  const original = await readRepoFile(config.dirname, target.path, 'utf8');
  const pkgData = JSON.parse(original);
  pkgData.version = newVersion;

  function setVersions(obj: any) {
    if (obj) {
      for (const key of Object.keys(obj)) {
        const version = packageVersions.get(key);
        if (version) {
          obj[key] = `${versionPrefix(obj[key], {
            canary: config.canary !== null,
          })}${printString(version)}`;
        }
      }
    }
  }
  // N.B. we are not doing anything with peer dependencies here
  setVersions(pkgData.dependencies);
  setVersions(pkgData.optionalDependencies);
  setVersions(pkgData.devDependencies);

  if (target.registry?.package_overrides) {
    for (const [key, value] of Object.entries(
      target.registry.package_overrides,
    )) {
      if (
        typeof pkgData[key] === 'object' &&
        pkgData[key] !== null &&
        typeof value === 'object' &&
        value !== null
      ) {
        Object.assign(pkgData[key], value);
      } else {
        pkgData[key] = value;
      }
    }
  }

  const str = stringifyPackage(
    pkgData,
    detectIndent(original).indent,
    detectNewline(original),
  );

  try {
    await writeRepoFile(config.dirname, target.path, str);
    return await fn();
  } finally {
    await writeRepoFile(config.dirname, target.path, original);
  }
}

function getConfigValue(
  name: string,
  config: {
    [key: string]: unknown;
  },
) {
  if (config[`@rollingversions/${name}`] !== undefined) {
    return config[`@rollingversions/${name}`];
  } else if (
    isObject(config['@rollingversions']) &&
    config['@rollingversions'][name] !== undefined
  ) {
    return config['@rollingversions'][name];
  }
  return undefined;
}

function getConfigName(
  name: string,
  config: {
    [key: string]: unknown;
  },
) {
  if (config[`@rollingversions/${name}`] !== undefined) {
    return `pkg["@rollingversions/${name}"]`;
  }
  return `pkg["@rollingversions"]["${name}"]`;
}

const failed = (reason: string): {ok: false; reason: string} => ({
  ok: false,
  reason,
});
function jsonParse(
  path: string,
  content: string,
): {ok: true; value: unknown} | {ok: false; reason: string} {
  try {
    return {ok: true, value: JSON.parse(content)};
  } catch (ex: any) {
    return {ok: false, reason: `Error parsing "${path}": ${ex.message}`};
  }
}

const PackageDependenciesCodec = t.Record(t.String, t.String);
const PackageJsonCodec = t.Intersect(
  t.Object({name: t.String}),
  t.Partial({
    dependencies: PackageDependenciesCodec,
    peerDependencies: PackageDependenciesCodec,
    optionalDependencies: PackageDependenciesCodec,
    devDependencies: PackageDependenciesCodec,
    private: t.Boolean,
    publishConfig: t.Partial({access: t.String}),
  }),
);

export default createPublishTargetAPI<PublishTarget.npm>({
  type: PublishTarget.npm,
  getPackageManifests(config, globalConfig) {
    return [
      {
        status: 'pattern',
        path: config.path,
        getPackageManifests: (
          path: string,
          content: string,
        ): GetManifestsResult[] => {
          const jsonParseResult = jsonParse(path, content);
          if (!jsonParseResult.ok) {
            return [{status: 'error', reason: jsonParseResult.reason}];
          }
          const validateResult = PackageJsonCodec.safeParse(
            jsonParseResult.value,
          );
          if (!validateResult.success) {
            return [{status: 'error', reason: t.showError(validateResult)}];
          }

          const pkg = validateResult.value;

          return [
            {
              status: 'manifest',
              manifest: {
                ...globalConfig,
                packageName: config.name ?? pkg.name,
                targetConfigs: [
                  {
                    type: PublishTarget.npm,
                    packageName: pkg.name,
                    path,
                    private: pkg.private === true,
                    publishConfigAccess: pkg.name.startsWith('@')
                      ? isObject(pkg.publishConfig) &&
                        pkg.publishConfig.access === 'public'
                        ? 'public'
                        : 'restricted'
                      : 'public',
                  },
                ],
                dependencies: {
                  required: [
                    ...(config.dependencies ?? []),
                    ...(pkg.dependencies ? Object.keys(pkg.dependencies) : []),
                    ...(pkg.peerDependencies
                      ? Object.keys(pkg.peerDependencies)
                      : []),
                  ],
                  optional: pkg.optionalDependencies
                    ? Object.keys(pkg.optionalDependencies)
                    : [],
                  development: pkg.devDependencies
                    ? Object.keys(pkg.devDependencies)
                    : [],
                },
              },
            },
          ];
        },
      },
    ];
  },
  legacyManifests: {
    pathMayContainPackage(filename) {
      return filename === 'package.json' || filename.endsWith('/package.json');
    },
    async getPackageManifest(
      path,
      content,
    ): Promise<
      {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
    > {
      let pkgData: unknown;
      try {
        pkgData = JSON.parse(content);
      } catch (ex: any) {
        return failed(ex.message);
      }
      if (!isObject(pkgData)) {
        return failed(`Expected package.json to be an object`);
      }

      if (!pkgData.name) {
        return {ok: true, manifest: null};
      }

      if (typeof pkgData.name !== 'string') {
        return failed(`Expected "name" to be a string`);
      }

      const pkgName = pkgData.name;
      if (getConfigValue('ignore', pkgData)) {
        return {ok: true, manifest: null};
      }

      const customized: (keyof RollingConfigOptions)[] = [];
      const rawConfig: {
        -readonly [k in keyof RollingConfigOptions]?: unknown;
      } = {};
      for (const [configKey, pkgKey] of KEYS_TO_CONFIG) {
        const value = getConfigValue(pkgKey, pkgData);
        if (value !== undefined) {
          rawConfig[configKey] = value;
          customized.push(configKey);
        }
      }
      if (rawConfig.versioning_mode === undefined) {
        const value = getConfigValue(`versioning`, pkgData);
        if (value !== undefined) {
          rawConfig.versioning_mode = value;
          customized.push(`versioning_mode`);
        }
      }

      const config = parseRollingConfigOptions(rawConfig);

      if (!config.success) {
        let reason = config.reason;
        for (const [configKey, pkgKey] of KEYS_TO_CONFIG) {
          reason = reason.split(configKey).join(getConfigName(pkgKey, pkgData));
        }
        return failed(reason);
      }

      const required = [
        ...(isObject(pkgData) && isObject(pkgData.dependencies)
          ? Object.keys(pkgData.dependencies)
          : []),
        ...(isObject(pkgData) && isObject(pkgData.peerDependencies)
          ? Object.keys(pkgData.peerDependencies)
          : []),
      ];

      const optional =
        isObject(pkgData) && isObject(pkgData.optionalDependencies)
          ? Object.keys(pkgData.optionalDependencies)
          : [];

      const development =
        isObject(pkgData) && isObject(pkgData.devDependencies)
          ? Object.keys(pkgData.devDependencies)
          : [];

      return {
        ok: true,
        manifest: {
          packageName: pkgName,
          ...config.value,
          scripts: {
            pre_release: [],
            post_release: [],
          },
          customized,
          targetConfigs: [
            {
              type: PublishTarget.npm,
              packageName: pkgName,
              path,
              private: pkgData.private === true,
              publishConfigAccess: pkgName.startsWith('@')
                ? isObject(pkgData.publishConfig) &&
                  pkgData.publishConfig.access === 'public'
                  ? 'public'
                  : 'restricted'
                : 'public',
            },
          ],
          dependencies: {required, optional, development},
        },
      };
    },
  },
  async prepublish(config, pkg, targetConfig, packageVersions) {
    if (targetConfig.private) return {ok: true};

    const semverVersion = printString(pkg.newVersion);
    return await withNpmVersion(
      config,
      targetConfig,
      semverVersion,
      packageVersions,
      async () => {
        const versions = await getVersions(config.dirname, targetConfig.path);
        const semverVersion = printString(pkg.newVersion);
        if (versions) {
          const max = [...versions]
            .filter((v) => !prerelease(v))
            .reduce((a, b) => (gt(a, b) ? a : b), '0.0.0');
          if (gt(max, semverVersion)) {
            return {
              ok: false,
              reason: `${
                pkg.packageName
              } already has a version ${max} on npm, which is greater than the version that would be published (${printString(
                pkg.newVersion,
              )}). Please add a tag/release in GitHub called "${
                pkg.packageName
              }@${max}" that points at the correct commit for ${max}`,
            };
          }
          if (versions.has(semverVersion)) {
            return {
              ok: false,
              reason: `${
                targetConfig.packageName
              } already has a version ${printString(pkg.newVersion)} on npm`,
            };
          }
        }

        await npmPublish(config.dirname, targetConfig.path, {
          dryRun: true,
          canary: config.canary !== null,
        });

        return {ok: true};
      },
    );
  },
  async publish(config, pkg, targetConfig, packageVersions) {
    if (targetConfig.private) return;
    await withNpmVersion(
      config,
      targetConfig,
      printString(pkg.newVersion),
      packageVersions,
      async () => {
        await npmPublish(config.dirname, targetConfig.path, {
          dryRun: config.dryRun,
          canary: config.canary !== null,
        });
      },
    );
  },
});
