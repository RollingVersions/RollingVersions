import {URL} from 'url';

import fetch from 'cross-fetch';

import {prepublish, publish as publishTarget} from '../PublishTargets';
import {checkGitHubReleaseStatus} from '../PublishTargets/github';
import {GitHubClient, auth} from '../services/github';
import type {PublishConfig} from '../types';
import {GetRepositoryApiResponse} from '../types/ApiResponse';
import {
  NoUpdateRequired,
  PackageStatusDetail,
  NewVersionToBePublished,
  PackageStatus,
} from '../utils/getPackageStatuses';

export enum PublishResultKind {
  NoUpdatesRequired = 0,
  UpdatesPublished = 1,
  CircularPackageDependencies = 2,
  GitHubAuthCheckFail = 3,
  PrepublishFailures = 4,
}
export interface NoUpdatesRequired {
  readonly kind: PublishResultKind.NoUpdatesRequired;
  readonly packages: readonly NoUpdateRequired[];
}
export interface UpdatesPublished {
  readonly kind: PublishResultKind.UpdatesPublished;
  readonly packages: readonly PackageStatusDetail[];
}
export interface CircularPackageDependencies {
  readonly kind: PublishResultKind.CircularPackageDependencies;
  readonly packageNames: readonly string[];
}
export interface GitHubAuthCheckFail {
  readonly kind: PublishResultKind.GitHubAuthCheckFail;
  readonly reason: string;
}
export interface PrepublishFailures {
  readonly kind: PublishResultKind.PrepublishFailures;
  readonly failures: readonly {
    readonly pkg: NewVersionToBePublished;
    readonly reasons: string[];
  }[];
}

export type Result =
  | NoUpdatesRequired
  | UpdatesPublished
  | CircularPackageDependencies
  | GitHubAuthCheckFail
  | PrepublishFailures;

export default async function publish(config: PublishConfig): Promise<Result> {
  const client = new GitHubClient({
    auth: auth.createTokenAuth(config.accessToken),
  });
  const url = new URL(`/api/${config.owner}/${config.name}`, config.backend);
  if (config.deployBranch) {
    url.searchParams.set(`branch`, config.deployBranch);
  }
  if (config.versionByBranch) {
    url.searchParams.set(`versionByBranch`, `true`);
  }
  const res = await fetch(url.href, {
    headers: {Authorization: `Bearer ${config.accessToken}`},
  });
  if (!res.ok) {
    return {
      kind: PublishResultKind.GitHubAuthCheckFail,
      reason: await res.text(),
    };
  }
  const response: GetRepositoryApiResponse = await res.json();

  if (response.cycleDetected?.length) {
    return {
      kind: PublishResultKind.CircularPackageDependencies,
      packageNames: response.cycleDetected,
    };
  }

  const packages = response.packages.map(
    (pkg): PackageStatusDetail => {
      if (pkg.newVersion) {
        return {
          status: PackageStatus.NewVersionToBePublished,
          packageName: pkg.manifest.packageName,
          currentTagName: pkg.manifest.versionTag?.name ?? null,
          currentVersion: pkg.manifest.versionTag?.version ?? null,
          newVersion: pkg.newVersion,
          changeSet: pkg.changeSet,
          manifest: pkg.manifest,
        };
      } else {
        return {
          status: PackageStatus.NoUpdateRequired,
          packageName: pkg.manifest.packageName,
          currentVersion: pkg.manifest.versionTag?.version ?? null,
          newVersion: pkg.manifest.versionTag?.version ?? null,
          manifest: pkg.manifest,
        };
      }
    },
  );
  if (config.canary !== null) {
    for (const pkg of packages) {
      if (pkg.status === PackageStatus.NewVersionToBePublished) {
        pkg.newVersion = {
          ...pkg.newVersion,
          prerelease: [`canary-${config.canary}`],
        };
      }
    }
  }

  config.logger.onValidatedPackages?.({
    packages,
    dryRun: config.dryRun,
  });

  if (
    !packages.some(
      (pkg) => pkg.status === PackageStatus.NewVersionToBePublished,
    )
  ) {
    return {
      kind: PublishResultKind.NoUpdatesRequired,
      packages: packages as NoUpdateRequired[],
    };
  }

  // prepublish checks
  const gitHubPrepublishInfo = await checkGitHubReleaseStatus(
    config,
    {
      headSha: response.headSha,
      name: response.branchName,
    },
    client,
  );
  if (!gitHubPrepublishInfo.ok) {
    return {
      kind: PublishResultKind.GitHubAuthCheckFail,
      reason: gitHubPrepublishInfo.reason,
    };
  }

  const packageVersions = new Map(
    packages.map((p) => [p.packageName, p.newVersion]),
  );
  const allTagNames = new Set(response.allTagNames);

  const failures: PrepublishFailures['failures'][number][] = [];
  for (const pkg of packages) {
    if (pkg.status === PackageStatus.NewVersionToBePublished) {
      const reasons = [];
      for (const prepublishResult of await prepublish(
        config,
        pkg,
        packageVersions,
        allTagNames,
      )) {
        if (!prepublishResult.ok) {
          reasons.push(prepublishResult.reason);
        }
      }
      if (reasons.length) {
        failures.push({pkg, reasons});
      }
    }
  }

  if (failures.length) {
    return {
      kind: PublishResultKind.PrepublishFailures,
      failures,
    };
  }

  for (const pkg of packages) {
    if (pkg.status === PackageStatus.NewVersionToBePublished) {
      await publishTarget(config, pkg, packageVersions, client);
    }
  }
  return {
    kind: PublishResultKind.UpdatesPublished,
    packages,
  };
}
