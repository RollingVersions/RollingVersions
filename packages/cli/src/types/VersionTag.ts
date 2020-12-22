import {t, compressedObjectCodec} from '../utils/ValidationCodec';

interface VersionTag {
  commitSha: string | undefined;
  name: string;
  version: string;
}

const VersionTag: t.Codec<VersionTag> = compressedObjectCodec(
  1,
  'VersionTag',
  {
    commitSha: t.Union(t.String, t.Undefined),
    name: t.String,
    version: t.String,
  },
  ['commitSha', 'name', 'version'],
);

export default VersionTag;
