import {
  PackageManifest,
  PackageDependencies,
  PackageManifestWithVersion,
  PublishTarget,
} from '../types';
import getVersionTag from './getVersionTag';

export default function addPackageVersions(
  packages: Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >,
  allTags: {commitSha: string; name: string}[],
): Map<
  string,
  {
    manifests: PackageManifestWithVersion[];
    dependencies: PackageDependencies;
  }
> {
  return new Map(
    [...packages].map(([packageName, {manifests, dependencies}]): [
      string,
      {
        manifests: PackageManifestWithVersion[];
        dependencies: PackageDependencies;
      },
    ] => {
      const tagFormat = manifests
        .map(
          (m) =>
            m.targetConfig.type === PublishTarget.custom_script &&
            m.targetConfig.tag_format,
        )
        .find((m) => m);
      return [
        packageName,
        {
          manifests: manifests.map(
            (manifest): PackageManifestWithVersion => {
              return {
                ...manifest,
                versionTag: getVersionTag(allTags, packageName, {
                  repoHasMultiplePackages: packages.size > 1,
                  tagFormat: tagFormat || null,
                }),
              };
            },
          ),
          dependencies,
        },
      ];
    }),
  );
}
