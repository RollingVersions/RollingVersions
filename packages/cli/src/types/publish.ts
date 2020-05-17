import PackageManifest from './PackageManifest';
import {
  SuccessPackageStatus,
  NewVersionToBePublished,
} from '../utils/getPackageStatuses';

export interface PublishConfig {
  dryRun: boolean;
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
  deployBranch: string | null;
  logger: PublishEventHandlers;
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
    pkgManifest: PackageManifest;
    dryRun: boolean;
  };
  onPublishedTargetRelease: {
    pkg: NewVersionToBePublished;
    pkgManifest: PackageManifest;
    dryRun: boolean;
  };
}

export type PublishEventHandlers = {
  [name in keyof PublishEvents]?: (e: PublishEvents[name]) => void;
};
