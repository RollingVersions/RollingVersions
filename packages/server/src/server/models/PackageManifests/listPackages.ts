import type {PackageManifest} from '@rollingversions/types';
import {
  pathMayContainPackage,
  getPackageManifests,
} from 'rollingversions/lib/PublishTargets';

import mergePackageManifests from './mergePackageManifests';

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
  const packageErrors: {filename: string; error: string}[] = [];
  const packagesWithErrors = new Set<string>();
  const packages = new Map<string, PackageManifest>();
  const pending: Promise<void>[] = [];
  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const {manifests, errors} = await getPackageManifests(file.path, contents);
    for (const error of errors) {
      packageErrors.push({filename: file.path, error});
    }
    for (const newManifest of manifests) {
      if (packagesWithErrors.has(newManifest.packageName)) {
        // do not look at additional occurrences of a package name if we
        // already found errors merging it
        continue;
      }
      const existingManifest = packages.get(newManifest.packageName);
      if (existingManifest) {
        const mergeResult = mergePackageManifests(
          existingManifest,
          newManifest,
        );
        if (mergeResult.ok) {
          packages.set(newManifest.packageName, mergeResult.manifest);
        } else {
          packages.delete(newManifest.packageName);
          packageErrors.push({filename: file.path, error: mergeResult.reason});
          packagesWithErrors.add(newManifest.packageName);
        }
      } else {
        packages.set(newManifest.packageName, newManifest);
      }
    }
  }
  for await (const file of files) {
    if (pathMayContainPackage(file.path)) {
      pending.push(pushFile(file));
    }
  }

  await Promise.all(pending);

  return {packages, packageErrors};
}
