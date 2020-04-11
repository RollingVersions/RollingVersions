import {pathMayContainPackage, getPackageInfo} from '../PublishTargets';
import getVersionTag from './getVersionTag';
import {PackageInfo} from '../types';

async function listPackagesWithoutTags(
  files: AsyncGenerator<
    {
      path: string;
      getContents: () => Promise<string>;
    },
    any,
    any
  >,
) {
  const packagesByName = new Map<string, Omit<PackageInfo, 'versionTag'>[]>();
  const pending: Promise<void>[] = [];
  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const packages = await getPackageInfo(file.path, contents);
    for (const p of packages) {
      let r = packagesByName.get(p.packageName);
      if (!r) {
        r = [];
        packagesByName.set(p.packageName, r);
      }
      r.push(p);
    }
  }
  for await (const file of files) {
    if (pathMayContainPackage(file.path)) {
      pending.push(pushFile(file));
    }
  }

  await Promise.all(pending);

  return packagesByName;
}

export default async function listPackages(
  allTagsPromise: Promise<{commitSha: string; name: string}[]>,
  files: AsyncGenerator<
    {
      path: string;
      getContents: () => Promise<string>;
    },
    any,
    any
  >,
) {
  const [allTags, packagesByName] = await Promise.all([
    allTagsPromise,
    listPackagesWithoutTags(files),
  ] as const);

  return new Map(
    [...packagesByName.entries()].map(
      ([packageName, packageInfos]) =>
        [
          packageName,
          packageInfos.map(
            (pi): PackageInfo => ({
              ...pi,
              versionTag: getVersionTag(
                allTags,
                packageName,
                pi.registryVersion,
                {isMonoRepo: packagesByName.size === 1},
              ),
            }),
          ),
        ] as const,
    ),
  );
}
