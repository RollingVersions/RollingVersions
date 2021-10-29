import * as t from 'funtypes';
enum VersioningMode {
  Unambiguous = 'UNAMBIGUOUS',
  ByBranch = 'BY_BRANCH',
  AlwaysIncreasing = 'ALWAYS_INCREASING',
}
export default VersioningMode;

const LiteralVersioningModeCodec = t.Enum(`VersioningMode`, VersioningMode);
export const VersioningModeCodec = t.Union(
  LiteralVersioningModeCodec,
  t.Readonly(
    t.Array(
      t.Readonly(
        t.Object({
          branch: t.String,
          mode: LiteralVersioningModeCodec,
        }),
      ),
    ),
  ),
);
export type VersioningModeConfig = t.Static<typeof VersioningModeCodec>;
