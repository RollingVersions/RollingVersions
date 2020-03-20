import {PackageInfos} from '@changelogversion/utils/lib/Platforms';
import PullChangeLog from '@changelogversion/utils/lib/PullChangeLog';
import Permission from './server/permissions/Permission';

export interface PullRequestResponse {
  headSha: string;
  permission: Permission;
  changeLogState: Omit<PullChangeLog, 'packageInfoCache'>;
  currentVersions: PackageInfos;
}
