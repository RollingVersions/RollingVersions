import ChangeSet from '@rollingversions/change-set';
import VersionNumber from '@rollingversions/version-number';

import PackageDependencies from './PackageDependencies';
import {PublishTargetConfig} from './PublishTarget';
import VersionTag from './VersionTag';

export interface ApiPackageResponse {
  manifest: {
    versionTag: VersionTag | null;
    packageName: string;
    tagFormat?: string | undefined;
    dependencies: PackageDependencies;
    targetConfigs: readonly PublishTargetConfig[];
  };
  changeSet: ChangeSet<{pr: number}>;
  newVersion: VersionNumber | null;
}
export interface GetRepositoryApiResponse {
  headSha: string & {
    readonly __brand?: 'git_commits_commit_sha' | undefined;
  };
  branchName: string;
  allTagNames: string[];
  packages: ApiPackageResponse[];
  cycleDetected: string[] | null;
}
