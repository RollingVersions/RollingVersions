import {pathMayContainPackage, getPackageManifests} from '../PublishTargets';
import {PackageManifest} from '../types';
import {mergePackageManifests} from '../types/PackageManifest';

export default async function listPackages(
  files: AsyncGenerator<
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
    for (const manifest of packages) {
      const existingManifest = packagesByName.get(manifest.packageName);
      if (existingManifest) {
        packagesByName.set(
          manifest.packageName,
          mergePackageManifests(existingManifest, manifest),
        );
      } else {
        packagesByName.set(manifest.packageName, manifest);
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
