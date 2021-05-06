import * as t from 'funtypes';

export const VersionNumberCodec = t.Named(
  `VersionNumber`,
  t.Readonly(
    t.Object({
      numerical: t.Readonly(t.Array(t.Number)),
      prerelease: t.Readonly(t.Array(t.String)),
      build: t.Readonly(t.Array(t.String)),
    }),
  ),
);
type VersionNumber = t.Static<typeof VersionNumberCodec>;

export default VersionNumber;
