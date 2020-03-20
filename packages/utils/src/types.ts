import {PackageInfos} from './Platforms';

export interface Repository {
  owner: string;
  name: string;
}
export interface PullRequest {
  repo: Repository;
  number: number;

  headSha: string;
  currentVersions: PackageInfos;
}
