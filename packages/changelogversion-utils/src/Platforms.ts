import VersionTag from './VersionTag';

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
