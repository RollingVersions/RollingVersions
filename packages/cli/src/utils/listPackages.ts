import {pathMayContainPackage, getPackageManifests} from '../PublishTargets';
import type {PackageManifest} from '../types';
import {mergePackageManifests} from '../types/PackageManifest';

export default async function listPackages(
  files:
    | {
        path: string;
        getContents: () => Promise<string>;
      }[]
    | AsyncGenerator<
        {
          path: string;
          getContents: () => Promise<string>;
        },
        any,
        any
      >,
) {
  const packagesByName = new Map<string, PackageManifest>();
  const pending: Promise<void>[] = [];
  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const packages = await getPackageManifests(file.path, contents);
    for (const newManifest of packages) {
      const existingManifest = packagesByName.get(newManifest.packageName);
      packagesByName.set(
        newManifest.packageName,
        existingManifest
          ? mergePackageManifests(existingManifest, newManifest)
          : newManifest,
      );
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
