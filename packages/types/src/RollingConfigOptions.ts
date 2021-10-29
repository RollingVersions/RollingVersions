import BaseVersion from './BaseVersion';
import ChangeType from './ChangeType';
import {VersioningModeConfig} from './VersioningMode';
import VersionSchema from './VersionSchema';

export default interface RollingConfigOptions {
  readonly tagFormat: string | undefined;
  readonly changeTypes: readonly ChangeType[];
  readonly versioningMode: VersioningModeConfig;
  readonly versionSchema: VersionSchema;
  readonly baseVersion: BaseVersion;
}
