import {
  PackageManifest,
  PackageDependencies,
  PackageManifestWithVersion,
} from '../types';
import {getRegistryVersion as GetRegistryVersionType} from '../PublishTargets';
import getVersionTag from './getVersionTag';

export default async function addPackageVersions(
  packages: Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >,
  allTags: {commitSha: string; name: string}[],
  getRegistryVersion: typeof GetRegistryVersionType,
): Promise<
  Map<
    string,
    {
      manifests: PackageManifestWithVersion[];
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
              manifests: PackageManifestWithVersion[];
              dependencies: PackageDependencies;
            },
          ]
        > => {
          return [
            packageName,
            {
              manifests: await Promise.all(
                manifests.map(
                  async (manifest): Promise<PackageManifestWithVersion> => {
                    const registryVersion = await getRegistryVersion(manifest);
                    return {
                      ...manifest,
                      registryVersion,
                      versionTag: getVersionTag(
                        allTags,
                        packageName,
                        registryVersion,
                        {isMonoRepo: packages.size > 1},
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
