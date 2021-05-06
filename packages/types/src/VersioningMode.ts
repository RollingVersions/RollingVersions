import * as t from 'funtypes';
enum VersioningMode {
  Unambiguous = 'UNAMBIGUOUS',
  ByBranch = 'BY_BRANCH',
  AlwaysIncreasing = 'ALWAYS_INCREASING',
}
export default VersioningMode;

export const VersioningModeCodec = t.Enum(`VersioningMode`, VersioningMode);
