import {PackageInfo} from 'changelogversion-utils/lib/Platforms';
import PullChangeLog from 'changelogversion-utils/lib/PullChangeLog';

export interface PullRequest {
  headSha: string;
  changeLogState: PullChangeLog | undefined;
  currentVersions: Array<[string, PackageInfo[]]>;
}
