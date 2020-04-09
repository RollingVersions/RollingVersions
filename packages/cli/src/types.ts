import {PackageInfo} from '@rollingversions/utils/lib/Platforms';
import {ChangeLogEntry} from '@rollingversions/utils/lib/PullChangeLog';

export enum Status {
  MissingTag,
  CicularDependencies,
  NoUpdateRequired,
  NewVersionToBePublished,
}
export interface MissingTag {
  status: Status.MissingTag;
  packageName: string;
  currentVersion: string;
  pkgInfos: readonly PackageInfo[];
}
export interface NoUpdateRequired {
  status: Status.NoUpdateRequired;
  packageName: string;
  currentVersion: string | null;
  newVersion: string | null;
  pkgInfos: readonly PackageInfo[];
}
export interface NewVersionToBePublished {
  status: Status.NewVersionToBePublished;
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeLogEntries: readonly (ChangeLogEntry & {pr: number})[];
  pkgInfos: readonly PackageInfo[];
}

export type PackageStatus =
  | MissingTag
  | NoUpdateRequired
  | NewVersionToBePublished;
export type SuccessPackageStatus = NoUpdateRequired | NewVersionToBePublished;

export function isNewVersionToBePublished(
  s: PackageStatus,
): s is NewVersionToBePublished {
  return s.status === Status.NewVersionToBePublished;
}
export function isSuccessPackageStatus(
  s: PackageStatus,
): s is SuccessPackageStatus {
  return (
    s.status === Status.NoUpdateRequired ||
    s.status === Status.NewVersionToBePublished
  );
}
export function areAllSuccessPackageStatuses(
  s: PackageStatus[],
): s is SuccessPackageStatus[] {
  return s.every(isSuccessPackageStatus);
}

export interface Config {
  dryRun: boolean;
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
  deployBranch: string | null;
  logger: PublishEventHandlers;
}

export type PrePublishResult = {ok: true} | {ok: false; reason: string};

export interface PackageDependencies {
  required: string[];
  optional: string[];
  development: string[];
}

export interface PublishEvents {
  onValidatedPackages: {
    packages: readonly SuccessPackageStatus[];
    dryRun: boolean;
  };

  onPublishGitHubRelease: {
    pkg: NewVersionToBePublished;
    tagName: string;
    dryRun: boolean;
  };
  onPublishedGitHubRelease: {
    pkg: NewVersionToBePublished;
    tagName: string;
    dryRun: boolean;
    response?: unknown;
  };

  onPublishTargetRelease: {
    pkg: NewVersionToBePublished;
    pkgInfo: PackageInfo;
    dryRun: boolean;
  };
  onPublishedTargetRelease: {
    pkg: NewVersionToBePublished;
    pkgInfo: PackageInfo;
    dryRun: boolean;
  };
}
export type PublishEventHandlers = {
  [name in keyof PublishEvents]?: (e: PublishEvents[name]) => void;
};
