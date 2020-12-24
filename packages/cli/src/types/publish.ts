import PackageManifest from './PackageManifest';
import {PublishTargetConfig} from './PublishTarget';
import Release from './Release';

export interface PackageToRelease {
  pkg: PackageManifest;
  release: Release;
}
export interface PackageWithNoChanges {
  pkg: PackageManifest;
  version: string | null;
}

export interface PublishConfig {
  dryRun: boolean;
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
  deployBranch: string | null;
  logger: PublishEventHandlers;
  canary: string | null;
}

export interface PublishEvents {
  onValidatedPackages: {
    packagesToRelease: readonly PackageToRelease[];
    packagesWithNoChanges: readonly PackageWithNoChanges[];
    dryRun: boolean;
  };

  onPublishGitHubRelease: {
    pkg: PackageManifest;
    release: Release;
    dryRun: boolean;
    canary: string | null;
  };
  onPublishedGitHubRelease: {
    pkg: PackageManifest;
    release: Release;
    dryRun: boolean;
    canary: string | null;
    response?: unknown;
  };

  onPublishTargetRelease: {
    pkg: PackageManifest;
    target: PublishTargetConfig;
    release: Release;
    dryRun: boolean;
  };
  onPublishedTargetRelease: {
    pkg: PackageManifest;
    target: PublishTargetConfig;
    release: Release;
    dryRun: boolean;
  };
}

export type PublishEventHandlers = {
  [name in keyof PublishEvents]?: (e: PublishEvents[name]) => void;
};
