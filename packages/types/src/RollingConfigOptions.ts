import {VersioningMode} from '.';
import BaseVersion from './BaseVersion';
import ChangeType from './ChangeType';
import VersionSchema from './VersionSchema';

export default interface RollingConfigOptions {
  readonly tagFormat: string | undefined;
  readonly changeTypes: readonly ChangeType[];
  readonly versioningMode: VersioningMode;
  readonly versionSchema: VersionSchema;
  readonly baseVersion: BaseVersion;
}
