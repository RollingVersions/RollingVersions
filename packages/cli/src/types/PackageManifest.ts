import {PublishTargetConfig} from './PublishTarget';
import VersionTag from './VersionTag';
import {t, compressedObjectCodec} from '../utils/ValidationCodec';

export default interface PackageManifest {
  path: string;
  packageName: string;
  notToBePublished: boolean;
  targetConfig: PublishTargetConfig;
}

export const PackageManifest: t.Codec<PackageManifest> = compressedObjectCodec(
  4,
  'PackageManifest',
  {
    path: t.String,
    packageName: t.String,
    notToBePublished: t.Boolean,
    targetConfig: PublishTargetConfig,
  },
  ['path', 'packageName', 'notToBePublished', 'targetConfig'],
);

export interface PackageManifestWithVersion extends PackageManifest {
  registryVersion: string | null;
  versionTag: VersionTag | null;
}

export const PackageManifestWithVersion: t.Codec<PackageManifestWithVersion> = compressedObjectCodec(
  4,
  'PackageManifest',
  {
    path: t.String,
    packageName: t.String,
    notToBePublished: t.Boolean,
    targetConfig: PublishTargetConfig,
    registryVersion: t.Union(t.String, t.Null),
    versionTag: t.Union(VersionTag, t.Null),
  },
  [
    'path',
    'packageName',
    'notToBePublished',
    'targetConfig',
    'registryVersion',
    'versionTag',
  ],
);
