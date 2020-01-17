import {PackageInfo, PackageInfos, Platform} from '../Platforms';
import {getNpmVersion} from '../Npm';
import getVersionTag from './getVersionTag';
import VersionTag from '../VersionTag';

async function getRegistryVerison(
  pkg: Omit<PackageInfo, 'versionTag' | 'registryVersion'>,
): Promise<string | null> {
  if (pkg.notToBePublished) return null;
  switch (pkg.platform) {
    case Platform.npm:
      return await getNpmVersion(pkg.packageName);
  }
}
export default async function addVersions(
  packages: Map<
    string,
    Array<Omit<PackageInfo, 'versionTag' | 'registryVersion'>>
  >,
  allTags: readonly Pick<VersionTag, 'commitSha' | 'name'>[],
) {
  const result: PackageInfos = {};
  await Promise.all(
    [...packages.entries()].map(async ([key, pkgInfos]) => {
      result[key] = await Promise.all(
        pkgInfos.map(
          async (pkg): Promise<PackageInfo> => {
            const registryVersion = await getRegistryVerison(pkg);
            return {
              ...pkg,
              registryVersion,
              versionTag: getVersionTag(
                allTags,
                pkg.packageName,
                registryVersion,
                packages.size === 1,
              ),
            };
          },
        ),
      );
    }),
  );
  return result;
}
