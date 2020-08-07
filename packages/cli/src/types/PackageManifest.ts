import PublishTarget, {publishTargetCodec, TargetConfig} from './PublishTarget';
import VersionTag, {VersionTagCodec} from './VersionTag';
import {
  t,
  compressedObjectCodec,
  versionSymbol,
} from '../utils/ValidationCodec';

export default interface PackageManifest<
  TPublishTarget extends PublishTarget = PublishTarget
> {
  path: string;
  publishTarget: TPublishTarget;
  packageName: string;
  notToBePublished: boolean;
  targetConfig: TargetConfig[TPublishTarget];
}

export interface PackageManifestWithVersion<
  TPublishTarget extends PublishTarget = PublishTarget
> extends PackageManifest<TPublishTarget> {
  registryVersion: string | null;
  versionTag: VersionTag | null;
}

const PublishConfigAccessCodec = t.union([
  t.literal('restricted'),
  t.literal('public'),
]);

const PackageManifestWithVersionLegacyCodec = compressedObjectCodec<{
  path: string;
  publishTarget: PublishTarget.npm;
  packageName: string;
  publishConfigAccess: 'restricted' | 'public';
  notToBePublished: boolean;
  registryVersion: string | null;
  versionTag: VersionTag | null;
}>()(
  1,
  'PackageManifestWithVersionLegacy',
  {
    path: t.string,
    publishTarget: t.literal(PublishTarget.npm),
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
const PackageManifestWithVersionCodecCurrent = compressedObjectCodec<
  PackageManifestWithVersion
>()(
  1.2,
  'PackageManifestWithVersion',
  {
    path: t.string,
    publishTarget: publishTargetCodec,
    packageName: t.string,
    publishConfigAccess: PublishConfigAccessCodec,
    notToBePublished: t.boolean,
    registryVersion: t.union([t.null, t.string]),
    versionTag: t.union([t.null, VersionTagCodec]),
    // tslint:disable-next-line: deprecation
    targetConfig: t.any,
  },
  [
    versionSymbol,
    'path',
    'publishTarget',
    'packageName',
    'notToBePublished',
    'registryVersion',
    'versionTag',
    'targetConfig',
  ],
);
export const PackageManifestWithVersionCodec = t.union([
  PackageManifestWithVersionLegacyCodec.pipe(
    new t.Type<
      PackageManifestWithVersion<PublishTarget.npm>,
      typeof PackageManifestWithVersionLegacyCodec._A,
      typeof PackageManifestWithVersionLegacyCodec._A
    >(
      'PackageManifestWithVersionCodecLegacy2',
      // never use this for encoding
      (_v: any): _v is PackageManifestWithVersion<PublishTarget.npm> => false,
      ({publishConfigAccess, ...v}) =>
        t.success({...v, targetConfig: {publishConfigAccess}}),
      () => {
        throw new Error('Encoding to the legacy encoding is not supported');
      },
    ),
  ),
  PackageManifestWithVersionCodecCurrent,
]);

const PackageManifestCodecLegacy = compressedObjectCodec<{
  path: string;
  publishTarget: PublishTarget.npm;
  packageName: string;
  publishConfigAccess: 'restricted' | 'public';
  notToBePublished: boolean;
}>()(
  2,
  'PackageManifestLegacy',
  {
    path: t.string,
    publishTarget: t.literal(PublishTarget.npm),
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

const PackageManifestCodecCurrent = compressedObjectCodec<PackageManifest>()(
  3,
  'PackageManifest',
  {
    path: t.string,
    publishTarget: publishTargetCodec,
    packageName: t.string,
    publishConfigAccess: PublishConfigAccessCodec,
    notToBePublished: t.boolean,
    // tslint:disable-next-line: deprecation
    targetConfig: t.any,
  },
  [
    versionSymbol,
    'path',
    'publishTarget',
    'packageName',
    'notToBePublished',
    'targetConfig',
  ],
);
export const PackageManifestCodec = t.union([
  PackageManifestWithVersionLegacyCodec.pipe(
    new t.Type<
      PackageManifest<PublishTarget.npm>,
      typeof PackageManifestWithVersionLegacyCodec._A,
      typeof PackageManifestWithVersionLegacyCodec._A
    >(
      'PackageManifestWithVersionCodecToPackageManifest',
      // never use this for encoding
      (_v: any): _v is PackageManifest<PublishTarget.npm> => false,
      ({registryVersion, versionTag, publishConfigAccess, ...v}) =>
        t.success({...v, targetConfig: {publishConfigAccess}}),
      () => {
        throw new Error('Encoding to the legacy encoding is not supported');
      },
    ),
  ),
  PackageManifestCodecLegacy.pipe(
    new t.Type<
      PackageManifest<PublishTarget.npm>,
      typeof PackageManifestCodecLegacy._A,
      typeof PackageManifestCodecLegacy._A
    >(
      'PullRequestStateLegacy2',
      // never use this for encoding
      (_v: any): _v is PackageManifest<PublishTarget.npm> => false,
      ({publishConfigAccess, ...v}) =>
        t.success({...v, targetConfig: {publishConfigAccess}}),
      () => {
        throw new Error('Encoding to the legacy encoding is not supported');
      },
    ),
  ),
  PackageManifestCodecCurrent,
]);
