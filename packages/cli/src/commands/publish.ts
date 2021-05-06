import {URL} from 'url';

import fetch from 'cross-fetch';

import {
  GetRepositoryApiResponse,
  VersioningMode,
  VersionTag,
} from '@rollingversions/types';
import {printString} from '@rollingversions/version-number';

import {prepublish, publish as publishTarget} from '../PublishTargets';
import {checkGitHubReleaseStatus} from '../PublishTargets/github';
import {getCurrentBranchName, getHeadSha} from '../services/git';
import {GitHubClient, auth} from '../services/github';
import PackageStatus, {
  NewVersionToBePublished,
  NoUpdateRequired,
  PackageStatusDetail,
} from '../types/PackageStatus';
import {PublishConfig} from '../types/publish';

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

  const headSha = await getHeadSha(config.dirname);
  const currentBranchName = await getCurrentBranchName(config.dirname);
  url.searchParams.set(`commit`, headSha);
  url.searchParams.set(`deployBranch`, currentBranchName);
  url.searchParams.set(`versioning`, config.versioning);

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
      if (pkg.currentVersion?.ok === false) {
        // TODO: report this error properly
        console.error(
          `${pkg.manifest.packageName} has a different version in the current branch vs. the latest published version overall.`,
        );
        console.error(
          `Current branch: ${
            pkg.currentVersion.branchVersion
              ? printString(pkg.currentVersion.branchVersion.version)
              : `unpublished`
          }`,
        );
        console.error(
          `Latest version: ${
            pkg.currentVersion.maxVersion
              ? printString(pkg.currentVersion.maxVersion.version)
              : `unpublished`
          }`,
        );
        console.error(
          `If you would like to base your next version number off the largest overall version, you can pass:`,
        );
        console.error(`--versioning ${VersioningMode.AlwaysIncreasing}`);
        console.error(
          `If you would like to be able to publish patch versions on branches, you can pass:`,
        );
        console.error(`--versioning ${VersioningMode.ByBranch}`);
        return process.exit(1);
      }
      const currentVersion: VersionTag | null = pkg.currentVersion?.ok
        ? pkg.currentVersion
        : null;
      if (pkg.newVersion) {
        return {
          status: PackageStatus.NewVersionToBePublished,
          packageName: pkg.manifest.packageName,
          currentTagName: currentVersion?.name ?? null,
          currentVersion: currentVersion?.version ?? null,
          newVersion: pkg.newVersion,
          changeSet: pkg.changeSet,
          manifest: pkg.manifest,
        };
      } else {
        return {
          status: PackageStatus.NoUpdateRequired,
          packageName: pkg.manifest.packageName,
          currentVersion: currentVersion?.version ?? null,
          newVersion: currentVersion?.version ?? null,
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
      headSha,
      defaultBranch: response.defaultBranch,
      deployBranch: response.deployBranch,
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
