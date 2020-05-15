import {pathMayContainPackage, getPackageManifests} from '../PublishTargets';
import {PackageManifest, PackageDependencies} from '../types';

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
  const packagesByName = new Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >();
  const pending: Promise<void>[] = [];
  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const packages = await getPackageManifests(file.path, contents);
    for (const {manifest, dependencies} of packages) {
      const r = packagesByName.get(manifest.packageName);
      if (!r) {
        packagesByName.set(manifest.packageName, {
          manifests: [manifest],
          dependencies,
        });
      } else {
        r.manifests.push(manifest);
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
