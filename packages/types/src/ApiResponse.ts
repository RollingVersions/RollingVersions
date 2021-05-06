import ChangeSet from './ChangeSet';
import PackageManifest from './PackageManifest';
import VersionNumber from './VersionNumber';
import {CurrentVersionTag} from './VersionTag';

export interface ApiPackageResponse {
  manifest: PackageManifest;
  changeSet: ChangeSet<{pr: number}>;
  currentVersion: CurrentVersionTag | null;
  newVersion: VersionNumber | null;
}
export interface GetRepositoryApiResponse {
  headSha: string;
  defaultBranch: {name: string; headSha: string | null};
  deployBranch: {name: string; headSha: string | null};
  allBranchNames: string[];
  allTagNames: string[];
  packages: ApiPackageResponse[];
  cycleDetected: string[] | null;
}
