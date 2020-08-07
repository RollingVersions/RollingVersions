import {
  getProfile,
  getOwners,
  getVersions,
  getOrgRoster,
  getNpmVersion,
  publish as npmPublish,
} from '../services/npm';
import {
  PackageManifest,
  PublishTarget,
  PublishConfig,
  PrePublishResult,
  PackageDependencies,
} from '../types';
import isObject from '../ts-utils/isObject';
import {readRepoFile, writeRepoFile} from '../services/git';

const stringifyPackage = require('stringify-package');
const detectIndent = require('detect-indent');
const detectNewline = require('detect-newline').graceful;

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
  pkg: PackageManifest,
  newVersion: string,
  packageVersions: Map<string, string | null>,
  fn: () => Promise<T>,
) {
  const original = await readRepoFile(config.dirname, pkg.path, 'utf8');
  const pkgData = JSON.parse(original);
  pkgData.version = newVersion;
  function setVersions(obj: any) {
    if (obj) {
      for (const key of Object.keys(obj)) {
        const version = packageVersions.get(key);
        if (version) {
          obj[key] = `${versionPrefix(obj[key], {
            canary: config.canary !== null,
          })}${version}`;
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
    await writeRepoFile(config.dirname, pkg.path, str);
    return await fn();
  } finally {
    await writeRepoFile(config.dirname, pkg.path, original);
  }
}

/**
 * returns true for package.json files
 */
export function pathMayContainPackage(filename: string): boolean {
  return filename === 'package.json' || filename.endsWith('/package.json');
}

export async function getRegistryVersion(pkg: PackageManifest) {
  if (pkg.notToBePublished) return null;
  return await getNpmVersion(pkg.packageName);
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
      manifest: {
        publishTarget: PublishTarget.npm,
        packageName: pkgName,
        path,
        notToBePublished: pkgData.private === true,
        targetConfig: {
          publishConfigAccess:
            pkgName[0] === '@'
              ? isObject(pkgData.publishConfig) &&
                pkgData.publishConfig.access === 'public'
                ? 'public'
                : 'restricted'
              : 'public',
        },
      },
      dependencies: {required, optional, development},
    };
  } else {
    return null;
  }
}

export async function prepublish(
  config: PublishConfig,
  pkg: PackageManifest,
  newVersion: string,
  packageVersions: Map<string, string | null>,
): Promise<PrePublishResult> {
  const [auth, owners, versions] = await Promise.all([
    getProfile(),
    getOwners(pkg.packageName),
    getVersions(pkg.packageName),
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

  if (!owners || !versions) {
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
    if (!owners.some((m) => m.name === profile.name)) {
      return {
        ok: false,
        reason: `The user @${profile.name} is not listed as a maintainer of ${pkg.packageName} on npm`,
      };
    }

    if (versions.has(newVersion)) {
      return {
        ok: false,
        reason: `${pkg.packageName} already has a version ${newVersion} on npm`,
      };
    }
  }

  await withNpmVersion(config, pkg, newVersion, packageVersions, async () => {
    await npmPublish(config.dirname, pkg.path, {
      dryRun: true,
      canary: config.canary !== null,
    });
  });

  return {ok: true};
}

export async function publish(
  config: PublishConfig,
  pkg: PackageManifest,
  newVersion: string,
  packageVersions: Map<string, string | null>,
) {
  await withNpmVersion(config, pkg, newVersion, packageVersions, async () => {
    await npmPublish(config.dirname, pkg.path, {
      dryRun: config.dryRun,
      canary: config.canary !== null,
    });
  });
}
