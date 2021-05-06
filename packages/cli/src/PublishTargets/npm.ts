import {gt, prerelease} from 'semver';

import {
  NpmPublishTargetConfig,
  PublishTarget,
  VersioningMode,
} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import {readRepoFile, writeRepoFile} from '../services/git';
import {
  getProfile,
  getOwners,
  getVersions,
  getOrgRoster,
  publish as npmPublish,
} from '../services/npm';
import isObject from '../ts-utils/isObject';
import {PublishConfig} from '../types/publish';
import createPublishTargetAPI from './baseTarget';

const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline').graceful;
const stringifyPackage = require('stringify-package');

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
  target: NpmPublishTargetConfig,
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

export default createPublishTargetAPI<NpmPublishTargetConfig>({
  type: PublishTarget.npm,
  pathMayContainPackage(filename) {
    return filename === 'package.json' || filename.endsWith('/package.json');
  },
  async getPackageManifest(path, content) {
    let pkgData: unknown;
    try {
      pkgData = JSON.parse(content);
    } catch (ex) {
      // ignore
    }

    if (isObject(pkgData) && typeof pkgData.name === 'string') {
      const pkgName = pkgData.name;
      if (getConfigValue('ignore', pkgData)) {
        return null;
      }

      const tagFormat = getConfigValue(`tag-format`, pkgData);
      if (tagFormat !== undefined && typeof tagFormat !== 'string') {
        throw new Error('Expected "tag-format" to be undefined or a string');
      }
      const versioning = getConfigValue(`versioning`, pkgData);
      if (
        versioning !== undefined &&
        versioning !== VersioningMode.AlwaysIncreasing &&
        versioning !== VersioningMode.ByBranch &&
        versioning !== VersioningMode.Unambiguous
      ) {
        throw new Error(
          `Expected "versioning" to be undefined or one of: ${Object.values(
            VersioningMode,
          )
            .map((v) => JSON.stringify(v))
            .join(`, `)}`,
        );
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
        packageName: pkgName,
        tagFormat,
        versioning,
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
      };
    } else {
      return null;
    }
  },
  async prepublish(config, pkg, targetConfig, packageVersions) {
    if (targetConfig.private) return {ok: true};
    const [auth, owners, versions] = await Promise.all([
      getProfile(),
      getOwners(targetConfig.packageName),
      getVersions(targetConfig.packageName),
    ] as const);

    if (!auth.authenticated) {
      return {
        ok: false,
        reason: 'Could not authenticate to npm: ' + auth.message,
      };
    }

    const profile = auth.profile;

    if (profile.tfaOnPublish) {
      return {
        ok: false,
        reason:
          'This user requires 2fa on publish to npm, which is not supported',
      };
    }

    if (!owners) {
      const orgName = targetConfig.packageName.split('/')[0].substr(1);
      if (
        targetConfig.packageName.startsWith('@') &&
        profile.name !== orgName
      ) {
        const orgRoster = await getOrgRoster(orgName);
        if (!orgRoster[profile.name]) {
          return {
            ok: false,
            reason: `@${profile.name} does not appear to have permission to publish new packages to @${orgName} on npm`,
          };
        }
      }
    } else {
      if (!owners.some((m) => m.name === profile.name)) {
        return {
          ok: false,
          reason: `The user @${profile.name} is not listed as a maintainer of ${targetConfig.packageName} on npm`,
        };
      }
    }
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

    await withNpmVersion(
      config,
      targetConfig,
      semverVersion,
      packageVersions,
      async () => {
        await npmPublish(config.dirname, targetConfig.path, {
          dryRun: true,
          canary: config.canary !== null,
        });
      },
    );

    return {ok: true};
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
