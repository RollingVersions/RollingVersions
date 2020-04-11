import {resolve, dirname} from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {
  getProfile,
  getPackument,
  getOrgRoster,
  getNpmVersion,
} from '../services/npm';
import {
  PackageInfo,
  PublishTarget,
  PublishConfig,
  PrePublishResult,
  PackageDependencies,
} from '../types';
import {spawnBuffered} from '../utils/spawn';
import isObject from '../ts-utils/isObject';

const stringifyPackage = require('stringify-package');
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline').graceful;

async function withNpmVersion<T>(
  config: PublishConfig,
  pkg: PackageInfo,
  newVersion: string,
  packageVersions: Map<string, string | null>,
  fn: (dir: string) => Promise<T>,
) {
  const filename = resolve(config.dirname, pkg.path);
  const original = readFileSync(filename, 'utf8');
  const pkgData = JSON.parse(original);
  pkgData.version = newVersion;
  function setVersions(obj: any) {
    if (obj) {
      for (const key of Object.keys(obj)) {
        const version = packageVersions.get(key);
        if (version) {
          obj[key] = `${
            obj[key][0] === '^' ? '^' : obj[key][0] === '~' ? '~' : ''
          }${version}`;
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
    writeFileSync(filename, str);
    return await fn(dirname(filename));
  } finally {
    writeFileSync(filename, original);
  }
}

/**
 * returns true for package.json files
 */
export function pathMayContainPackage(filename: string): boolean {
  return /\/package\.json$/.test(filename);
}

/**
 * Parses the JSON and returns all the package info except
 * the version tag.
 */
export async function getPackageInfo(
  path: string,
  content: string,
): Promise<Omit<PackageInfo, 'versionTag'> | null> {
  let result: unknown;
  try {
    result = JSON.parse(content);
  } catch (ex) {
    // ignore
  }

  if (isObject(result) && typeof result.name === 'string') {
    return {
      publishTarget: PublishTarget.npm,
      packageName: result.name,
      registryVersion: await getNpmVersion(result.name),
      path,
      publishConfigAccess:
        result.name[0] === '@'
          ? isObject(result.publishConfig) &&
            result.publishConfig.access === 'public'
            ? 'public'
            : 'restricted'
          : 'public',
      notToBePublished: result.private === true,
    };
  } else {
    return null;
  }
}

export function getDependencies(
  config: Pick<PublishConfig, 'dirname'>,
  pkg: PackageInfo,
): PackageDependencies {
  const filename = resolve(config.dirname, pkg.path);
  const original = readFileSync(filename, 'utf8');
  const pkgData: unknown = JSON.parse(original);

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

  return {required, optional, development};
}

export async function prepublish(
  config: PublishConfig,
  pkg: PackageInfo,
  newVersion: string,
  packageVersions: Map<string, string | null>,
): Promise<PrePublishResult> {
  const [profile, packument] = await Promise.all([
    getProfile(),
    getPackument(pkg.packageName, true),
  ]);

  if (!profile) {
    return {ok: false, reason: 'Could not authenticate to npm'};
  }

  if (profile.tfaOnPublish) {
    return {
      ok: false,
      reason:
        'This user requires 2fa on publish to npm, which is not supported',
    };
  }

  if (!packument) {
    const orgName = pkg.packageName.split('/')[0].substr(1);
    if (pkg.packageName[0] === '@' && profile.name !== orgName) {
      const orgRoster = await getOrgRoster(orgName);
      if (!orgRoster[profile.name]) {
        return {
          ok: false,
          reason: `@${profile.name} does not appear to have permission to publish new packages to @${orgName} on npm`,
        };
      }
    }
  } else {
    if (!packument.maintainers.some((m) => m.name === profile.name)) {
      return {
        ok: false,
        reason: `The user @${profile.name} is not listed as a maintainer of ${pkg.packageName} on npm`,
      };
    }

    if (newVersion in packument.versions) {
      return {
        ok: false,
        reason: `${pkg.packageName} already has a version ${newVersion} on npm`,
      };
    }
  }

  await withNpmVersion(
    config,
    pkg,
    newVersion,
    packageVersions,
    async (cwd) => {
      await spawnBuffered('npm', ['publish', '--dry-run'], {cwd});
    },
  );

  return {ok: true};
}

export async function publish(
  config: PublishConfig,
  pkg: PackageInfo,
  newVersion: string,
  packageVersions: Map<string, string | null>,
) {
  await withNpmVersion(
    config,
    pkg,
    newVersion,
    packageVersions,
    async (cwd) => {
      await spawnBuffered(
        'npm',
        ['publish', ...(config.dryRun ? ['--dry-run'] : [])],
        {cwd},
      );
    },
  );
}
