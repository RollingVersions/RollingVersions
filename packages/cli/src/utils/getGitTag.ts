import {SuccessPackageStatus, NewVersionToBePublished} from '../types';

/**
 * If you start with RollingVersions from scratch, we always use the tag format:
 *
 * `example@1.0.0`
 *
 * But we will attempt to detect and match existing repos with tags formatted like:
 *
 * `v1.0.0` or `1.0.0`
 *
 * if the package contains exactly 1 package.
 */
function isSinglePackageWithDirectVersion(
  packages: readonly SuccessPackageStatus[],
) {
  return (
    packages.length === 1 &&
    packages[0].pkgInfos.some((p) => p.versionTag) &&
    packages[0].pkgInfos.every(
      (p) => !p.versionTag || !p.versionTag.name.includes?.('@'),
    )
  );
}

/**
 * If you start with RollingVersions from scratch, we always use the tag format:
 *
 * `example@1.0.0`
 *
 * But we will attempt to detect and match existing repos with tags formatted like:
 *
 * `v1.0.0` or `example@v1.0.0`
 *
 * If all existing tags are formatted that way
 */
function gitTagsHavePrefixV(packages: readonly SuccessPackageStatus[]) {
  return (
    packages.some((p) => p.pkgInfos.some((pi) => pi.versionTag)) &&
    packages.every((p) =>
      p.pkgInfos.every(
        (pi) =>
          !pi.versionTag ||
          pi.versionTag.name.replace(/^.*\@/, '').startsWith('v'),
      ),
    )
  );
}

/**
 * Get the expected Git tag of a new package to be published
 *
 * @param allPackages All packages in the monorepo
 * @param pkg The new package to be published
 */
export default function getGitTag(
  allPackages: readonly SuccessPackageStatus[],
  pkg: NewVersionToBePublished,
) {
  const start = isSinglePackageWithDirectVersion(allPackages)
    ? ``
    : `${pkg.packageName}@`;
  const end = gitTagsHavePrefixV(allPackages)
    ? `v${pkg.newVersion}`
    : pkg.newVersion;
  return `${start}${end}`;
}
