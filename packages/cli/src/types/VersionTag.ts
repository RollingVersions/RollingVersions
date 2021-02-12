import VersionNumber from '@rollingversions/version-number';
import {t, compressedObjectCodec} from '../utils/ValidationCodec';

interface VersionTag {
  commitSha: string;
  name: string;
  version: VersionNumber;
}

const VersionNumberCodec: t.Codec<VersionNumber> = t
  .Object({
    numerical: t.ReadonlyArray(t.Number),
    prerelease: t.ReadonlyArray(t.String),
    build: t.ReadonlyArray(t.String),
  })
  .asReadonly();

const VersionTag: t.Codec<VersionTag> = compressedObjectCodec(
  1,
  'VersionTag',
  {
    commitSha: t.String,
    name: t.String,
    version: VersionNumberCodec,
  },
  ['commitSha', 'name', 'version'],
);

export default VersionTag;
