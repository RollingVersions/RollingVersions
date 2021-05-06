import ChangeSet from '@rollingversions/change-set';
import {PackageManifest} from '@rollingversions/types';
import VersionNumber from '@rollingversions/version-number';

enum PackageStatus {
  NoUpdateRequired = 1,
  NewVersionToBePublished = 2,
}
export default PackageStatus;

export interface NoUpdateRequired {
  status: PackageStatus.NoUpdateRequired;
  packageName: string;
  currentVersion: VersionNumber | null;
  newVersion: VersionNumber | null;
  manifest: PackageManifest;
}

export interface NewVersionToBePublished {
  status: PackageStatus.NewVersionToBePublished;
  packageName: string;
  currentTagName: string | null;
  currentVersion: VersionNumber | null;
  newVersion: VersionNumber;
  changeSet: ChangeSet<{pr: number}>;
  manifest: PackageManifest;
}

export type PackageStatusDetail = NoUpdateRequired | NewVersionToBePublished;
