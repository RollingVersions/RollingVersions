import PublishTarget, {publishTargetCodec} from './PublishTarget';
import VersionTag, {VersionTagCodec} from './VersionTag';
import {
  t,
  compressedObjectCodec,
  versionSymbol,
} from '../utils/ValidationCodec';

export default interface PackageManifest {
  path: string;
  publishTarget: PublishTarget;
  packageName: string;
  publishConfigAccess: 'restricted' | 'public';
  notToBePublished: boolean;
}
export interface PackageManifestWithVersion {
  path: string;
  publishTarget: PublishTarget;
  packageName: string;
  publishConfigAccess: 'restricted' | 'public';
  notToBePublished: boolean;
  registryVersion: string | null;
  versionTag: VersionTag | null;
}

const PublishConfigAccessCodec = t.union([
  t.literal('restricted'),
  t.literal('public'),
]);

export const PackageManifestWithVersionCodec = compressedObjectCodec<
  PackageManifestWithVersion
>()(
  1,
  'PackageManifestWithVersion',
  {
    path: t.string,
    publishTarget: publishTargetCodec,
    packageName: t.string,
    publishConfigAccess: PublishConfigAccessCodec,
    notToBePublished: t.boolean,
    registryVersion: t.union([t.null, t.string]),
    versionTag: t.union([t.null, VersionTagCodec]),
  },
  [
    versionSymbol,
    'path',
    'publishTarget',
    'packageName',
    'publishConfigAccess',
    'notToBePublished',
    'registryVersion',
    'versionTag',
  ],
);
const PackageManifestCodecNew = compressedObjectCodec<PackageManifest>()(
  2,
  'PackageManifest',
  {
    path: t.string,
    publishTarget: publishTargetCodec,
    packageName: t.string,
    publishConfigAccess: PublishConfigAccessCodec,
    notToBePublished: t.boolean,
  },
  [
    versionSymbol,
    'path',
    'publishTarget',
    'packageName',
    'publishConfigAccess',
    'notToBePublished',
  ],
);
export const PackageManifestCodec = t.union([
  PackageManifestWithVersionCodec.pipe(
    new t.Type<
      PackageManifest,
      PackageManifestWithVersion,
      PackageManifestWithVersion
    >(
      'PullRequestStateLegacy',
      // never use this for encoding
      (_v: any): _v is PackageManifest => false,
      ({registryVersion, versionTag, ...v}) => t.success(v),
      () => {
        throw new Error('Encoding to the legacy encoding is not supported');
      },
    ),
  ),
  PackageManifestCodecNew,
]);
