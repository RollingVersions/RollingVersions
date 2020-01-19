import VersionTag from './VersionTag';

export enum Platform {
  npm = 'npm',
}

export interface PackageInfo {
  path: string;
  packageName: string;
  platform: Platform;
  publishConfigAccess: 'restricted' | 'public';
  notToBePublished: boolean;
  registryVersion: string | null;
  versionTag: VersionTag | null;
}

export type PackageInfos = {[name: string]: PackageInfo[] | undefined};
