import {PublishTargetConfig} from './PublishTarget';
import {t} from '../utils/ValidationCodec';
import PackageDependencies, {
  mergePackageDependencies,
  PackageDependenciesCodec,
} from './PackageDependencies';
import VersionTag from './VersionTag';

export default interface PackageManifest {
  packageName: string;
  /**
   * The tag format lets you override the tag that is generated in GitHub's releases
   */
  tagFormat?: string;
  dependencies: PackageDependencies;
  targetConfigs: readonly PublishTargetConfig[];
}

export const PackageManifestCodec: t.Codec<PackageManifest> = t
  .Object({
    packageName: t.String,
    dependencies: PackageDependenciesCodec,
    targetConfigs: t.ReadonlyArray(PublishTargetConfig),
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

export interface PackageManifestWithVersion extends PackageManifest {
  versionTag: VersionTag | null;
}

export const PackageManifestWithVersion: t.Codec<PackageManifestWithVersion> = t
  .Object({
    packageName: t.String,
    dependencies: PackageDependenciesCodec,
    targetConfigs: t.ReadonlyArray(PublishTargetConfig),
    versionTag: t.Union(VersionTag, t.Null),
  })
  .And(
    t.Partial({
      tagFormat: t.String,
    }),
  );
