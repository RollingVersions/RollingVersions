import {PublishTargetConfig} from './PublishTarget';
import {t, compressedObjectCodec} from '../utils/ValidationCodec';
import {RuntypeBase} from 'funtypes/lib/runtype';

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

export interface PackageManifestWithVersion<
  Tag = {name: string; version: string}
> extends PackageManifest {
  registryVersion: string | null;
  versionTag: Tag | null;
}

export const PackageManifestWithVersion = <
  TValue,
  TCodec extends RuntypeBase<TValue>
>(
  codec: TCodec,
) => {
  return compressedObjectCodec(
    4,
    'PackageManifest',
    {
      path: t.String,
      packageName: t.String,
      notToBePublished: t.Boolean,
      targetConfig: PublishTargetConfig,
      registryVersion: t.Union(t.String, t.Null),
      versionTag: t.Union(codec, t.Null),
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
};
