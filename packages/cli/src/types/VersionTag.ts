import {
  t,
  compressedObjectCodec,
  versionSymbol,
} from '../utils/ValidationCodec';

export default interface VersionTag {
  commitSha: string;
  name: string;
  version: string;
}

export const VersionTagCodec = compressedObjectCodec<VersionTag>()(
  1,
  'VersionTag',
  {
    commitSha: t.string,
    name: t.string,
    version: t.string,
  },
  [versionSymbol, 'commitSha', 'name', 'version'],
);
