import {PackageInfos} from 'changelogversion-utils/lib/Platforms';
import PullChangeLog from 'changelogversion-utils/lib/PullChangeLog';

export interface PullRequest {
  headSha: string;
  changeLogState: Omit<PullChangeLog, 'packageInfoCache'> | undefined;
  currentVersions: PackageInfos;
}
