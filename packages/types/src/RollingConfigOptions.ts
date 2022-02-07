import BaseVersion from './BaseVersion';
import ChangeType from './ChangeType';
import {VersioningModeConfig} from './VersioningMode';
import VersionSchema from './VersionSchema';

export default interface RollingConfigOptions {
  readonly tag_format: string | undefined;
  readonly change_types: readonly ChangeType[];
  readonly versioning_mode: VersioningModeConfig;
  readonly version_schema: VersionSchema;
  readonly base_version: BaseVersion;
}
