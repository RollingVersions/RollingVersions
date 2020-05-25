import {prerelease} from 'semver';
import {
  PackageManifest,
  PackageDependencies,
  PackageManifestWithVersion,
} from '../types';
import {getRegistryVersion} from '../PublishTargets';
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
                    const registryVersionRaw = await getRegistryVersion(
                      manifest,
                    );
                    const registryVersion =
                      registryVersionRaw && !prerelease(registryVersionRaw)
                        ? registryVersionRaw
                        : null;
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
