import {PublishTargetConfig} from './PublishTarget';
import {t} from '../utils/ValidationCodec';
import PackageDependencies, {
  mergePackageDependencies,
  PackageDependenciesCodec,
} from './PackageDependencies';

export default interface PackageManifest {
  packageName: string;
  /**
   * The tag format lets you override the tag that is generated in GitHub's releases
   */
  tagFormat?: string;
  dependencies: PackageDependencies;
  targetConfigs: PublishTargetConfig[];
}

export const PackageManifestCodec: t.Codec<PackageManifest> = t
  .Object({
    packageName: t.String,
    dependencies: PackageDependenciesCodec,
    targetConfigs: t.Array(PublishTargetConfig),
  })
  .And(
    t.Partial({
      tagFormat: t.String,
    }),
  );

export function mergePackageManifests(
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
      `Cannot use two different tag foramts for "${a.packageName}": "${a.tagFormat}" and "${b.tagFormat}"`,
    );
  }
  return {
    packageName: a.packageName,
    tagFormat: a.tagFormat ?? b.tagFormat,
    dependencies: mergePackageDependencies(a.dependencies, b.dependencies),
    targetConfigs: [...a.targetConfigs, ...b.targetConfigs],
  };
}
