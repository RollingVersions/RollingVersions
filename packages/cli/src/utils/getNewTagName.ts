import {PublishTarget} from '../types';
import {
  PackageStatusDetail,
  NewVersionToBePublished,
} from './getPackageStatuses';
import parseVersionTagTemplate from './parseVersionTagTemplate';

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
  packages: readonly PackageStatusDetail[],
) {
  return (
    packages.length === 1 &&
    packages[0].manifests.some((p) => p.versionTag) &&
    packages[0].manifests.every(
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
function gitTagsHavePrefixV(packages: readonly PackageStatusDetail[]) {
  return (
    packages.some((p) => p.manifests.some((pi) => pi.versionTag)) &&
    packages.every((p) =>
      p.manifests.every(
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
export default function getNewTagName(
  allPackages: readonly PackageStatusDetail[],
  pkg: NewVersionToBePublished,
) {
  const tagFormat = pkg.manifests
    .map(
      (m) =>
        m.targetConfig.type === PublishTarget.custom_script &&
        m.targetConfig.tag_format,
    )
    .find((m) => m);
  if (tagFormat) {
    const [MAJOR, MINOR, PATCH] = pkg.newVersion.split('.');
    return parseVersionTagTemplate(tagFormat).applyTemplate({
      PACKAGE_NAME: pkg.packageName,
      MAJOR,
      MINOR,
      PATCH,
    });
  }
  const start = isSinglePackageWithDirectVersion(allPackages)
    ? ``
    : `${pkg.packageName}@`;
  const end = gitTagsHavePrefixV(allPackages)
    ? `v${pkg.newVersion}`
    : pkg.newVersion;
  return `${start}${end}`;
}
