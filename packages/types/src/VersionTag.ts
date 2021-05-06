import * as t from 'funtypes';

import VersionNumber, {VersionNumberCodec} from './VersionNumber';

export const VersionTagCodec = t.Named(
  `VersionTag`,
  t.Readonly(
    t.Object({
      commitSha: t.String,
      name: t.String,
      version: VersionNumberCodec,
    }),
  ),
);
type VersionTag = t.Static<typeof VersionTagCodec>;
export default VersionTag;

export type CurrentVersionTag =
  | {
      ok: true;
      commitSha: string;
      name: string;
      version: VersionNumber;
    }
  | {
      ok: false;
      maxVersion: VersionTag | null;
      branchVersion: VersionTag | null;
    };
