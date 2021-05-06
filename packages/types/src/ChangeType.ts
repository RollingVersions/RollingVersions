import ChangeTypeID from './ChangeTypeID';
import VersionBumpType from './VersionBumpType';

export default interface ChangeType {
  readonly id: ChangeTypeID;
  readonly plural: string;
  readonly bumps: VersionBumpType | null;
}
