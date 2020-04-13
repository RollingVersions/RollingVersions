import PublishTarget, {publishTargetCodec} from './PublishTarget';
import VersionTag, {VersionTagCodec} from './VersionTag';
import {
  t,
  compressedObjectCodec,
  versionSymbol,
} from '../utils/ValidationCodec';

export default interface PackageInfo {
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

export const PackageInfoCodec = compressedObjectCodec(
  1,
  'PackageInfo',
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
