import {PackageManifest, PackageManifestWithVersion} from '../types';
import getVersionTag from './getVersionTag';

export default function addPackageVersions(
  packages: Map<string, PackageManifest>,
  allTags: {commitSha: string; name: string}[],
): Map<string, PackageManifestWithVersion> {
  return new Map(
    [...packages].map(([packageName, manifest]): [
      string,
      PackageManifestWithVersion,
    ] => {
      const tagFormat = manifest.tagFormat;
      return [
        packageName,
        {
          ...manifest,
          versionTag: getVersionTag(allTags, packageName, {
            repoHasMultiplePackages: packages.size > 1,
            tagFormat: tagFormat || null,
          }),
        },
      ];
    }),
  );
}
