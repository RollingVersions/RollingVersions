import Octokit from '@octokit/rest';

export type VersionTag = Octokit.ReposListTagsResponseItem & {version: string};
export enum Platform {
  npm = 'npm',
}
export interface PackageInfo {
  packageName: string;
  platform: Platform;
  notToBePublished: boolean;
  registryVersion: string | null;
  versionTag: VersionTag | null;
}
export type PackageInfos = {[name: string]: PackageInfo[] | undefined};
