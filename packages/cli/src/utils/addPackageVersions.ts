import {parseTag} from '@rollingversions/tag-format';
import {isPrerelease, max} from '@rollingversions/version-number';

import isTruthy from '../ts-utils/isTruthy';
import type {
  PackageManifest,
  PackageManifestWithVersion,
  VersionTag,
} from '../types';

export default function addPackageVersions(
  packages: Map<string, PackageManifest>,
  allTags: {commitSha: string; name: string}[],
): Map<string, PackageManifestWithVersion> {
  return new Map(
    [...packages].map(([packageName, manifest]): [
      string,
      PackageManifestWithVersion,
    ] => {
      return [
        packageName,
        {
          ...manifest,
          versionTag:
            max(
              allTags
                .map((tag): VersionTag | null => {
                  const version = parseTag(tag.name, {
                    allowTagsWithoutPackageName: packages.size <= 1,
                    packageName,
                    tagFormat: manifest.tagFormat,
                  });
                  return version && !isPrerelease(version)
                    ? {commitSha: tag.commitSha, name: tag.name, version}
                    : null;
                })
                .filter(isTruthy),
              (tag) => tag.version,
            ) ?? null,
        },
      ];
    }),
  );
}
