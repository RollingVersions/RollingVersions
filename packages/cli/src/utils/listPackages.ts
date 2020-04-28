import {pathMayContainPackage, getPackageInfo} from '../PublishTargets';
import getVersionTag from './getVersionTag';
import {PackageInfo, PackageDependencies} from '../types';

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
  const packagesByName = new Map<
    string,
    {
      infos: Omit<PackageInfo, 'versionTag'>[];
      dependencies: PackageDependencies;
    }
  >();
  const pending: Promise<void>[] = [];
  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const packages = await getPackageInfo(file.path, contents);
    for (const {info, dependencies} of packages) {
      const r = packagesByName.get(info.packageName);
      if (!r) {
        packagesByName.set(info.packageName, {infos: [info], dependencies});
      } else {
        r.infos.push(info);
        for (const type of ['required', 'optional', 'development'] as const) {
          r.dependencies[type].push(
            ...dependencies[type].filter(
              (d) => !r.dependencies[type].includes(d),
            ),
          );
        }
      }
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

export type ListedPackages = Map<
  string,
  {infos: PackageInfo[]; dependencies: PackageDependencies}
>;
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
): Promise<ListedPackages> {
  const [allTags, packagesByName] = await Promise.all([
    allTagsPromise,
    listPackagesWithoutTags(files),
  ] as const);

  return new Map(
    [...packagesByName.entries()].map(
      ([packageName, {infos, dependencies}]) =>
        [
          packageName,
          {
            infos: infos.map(
              (pi): PackageInfo => ({
                ...pi,
                versionTag: getVersionTag(
                  allTags,
                  packageName,
                  pi.registryVersion,
                  {isMonoRepo: packagesByName.size > 1},
                ),
              }),
            ),
            dependencies,
          },
        ] as const,
    ),
  );
}
