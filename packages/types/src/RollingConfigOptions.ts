import ChangeType from './ChangeType';
import VersionSchema from './VersionSchema';

export default interface RollingConfigOptions {
  readonly tagFormat: string | undefined;
  readonly changeTypes: readonly ChangeType[];
  readonly versionSchema: VersionSchema;
  readonly baseVersion: readonly number[];
}
