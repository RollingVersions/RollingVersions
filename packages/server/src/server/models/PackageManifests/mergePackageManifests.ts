import {PackageManifest} from '@rollingversions/types';

import mergePackageDependencies from './mergePackageDependencies';

export default function mergePackageManifests(
  a: PackageManifest,
  b: PackageManifest,
): PackageManifest {
  if (a.packageName !== b.packageName) {
    throw new Error(
      `Cannot merge two package manifests with different names: "${a.packageName}" and "${b.packageName}"`,
    );
  }
  if (
    a.tagFormat !== undefined &&
    b.tagFormat !== undefined &&
    a.tagFormat !== b.tagFormat
  ) {
    throw new Error(
      `Cannot use two different tag formats for "${a.packageName}": "${a.tagFormat}" and "${b.tagFormat}"`,
    );
  }
  if (
    a.versioning !== undefined &&
    b.versioning !== undefined &&
    a.versioning !== b.versioning
  ) {
    throw new Error(
      `Cannot use two different versioning modes for "${a.packageName}": "${a.versioning}" and "${b.versioning}"`,
    );
  }
  return {
    packageName: a.packageName,
    tagFormat: a.tagFormat ?? b.tagFormat,
    versioning: a.versioning ?? b.versioning,
    dependencies: mergePackageDependencies(a.dependencies, b.dependencies),
    targetConfigs: [...a.targetConfigs, ...b.targetConfigs],
  };
}
