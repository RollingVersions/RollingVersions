import {
  PackageManifest,
  PackageDependencies,
  PackageManifestWithVersion,
  PublishTarget,
} from '../types';
import {getRegistryVersion as GetRegistryVersionType} from '../PublishTargets';
import getVersionTag from './getVersionTag';

export default async function addPackageVersions<
  Tag extends {readonly name: string}
>(
  packages: Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >,
  allTags: Tag[],
  getRegistryVersion: typeof GetRegistryVersionType,
): Promise<
  Map<
    string,
    {
      manifests: PackageManifestWithVersion<Tag & {version: string}>[];
      dependencies: PackageDependencies;
    }
  >
> {
  return new Map(
    await Promise.all(
      [...packages].map(
        async ([packageName, {manifests, dependencies}]): Promise<
          [
            string,
            {
              manifests: PackageManifestWithVersion<Tag & {version: string}>[];
              dependencies: PackageDependencies;
            },
          ]
        > => {
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
              manifests: await Promise.all(
                manifests.map(
                  async (
                    manifest,
                  ): Promise<
                    PackageManifestWithVersion<Tag & {version: string}>
                  > => {
                    const registryVersion = await getRegistryVersion(manifest);
                    return {
                      ...manifest,
                      registryVersion,
                      versionTag: getVersionTag(
                        allTags,
                        packageName,
                        registryVersion,
                        {
                          repoHasMultiplePackages: packages.size > 1,
                          tagFormat: tagFormat || null,
                        },
                      ),
                    };
                  },
                ),
              ),
              dependencies,
            },
          ];
        },
      ),
    ),
  );
}
