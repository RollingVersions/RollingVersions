import {prepublish, publish as publishTarget} from '../PublishTargets';
import {checkGitHubReleaseStatus} from '../PublishTargets/github';
import {getAllFiles} from '../services/git';
import {
  GitHubClient,
  auth,
  getAllTags,
  getAllCommits,
} from '../services/github';
import splitAsyncGenerator from '../ts-utils/splitAsyncGenerator';
import type {PublishConfig} from '../types';
import addPackageVersions from '../utils/addPackageVersions';
import type {
  NoUpdateRequired,
  PackageStatusDetail,
  NewVersionToBePublished,
} from '../utils/getPackageStatuses';
import getPackageStatuses, {PackageStatus} from '../utils/getPackageStatuses';
import listPackages from '../utils/listPackages';
import sortPackages from '../utils/sortPackages';

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

  const [packageManifestsWithoutVersions, allTags] = await Promise.all([
    listPackages(getAllFiles(config.dirname)),
    getAllTags(client, {owner: config.owner, name: config.name}),
  ]);
  const packageManifests = addPackageVersions(
    packageManifestsWithoutVersions,
    allTags,
  );

  const getAllCommitsCached = splitAsyncGenerator(
    getAllCommits(
      client,
      {owner: config.owner, name: config.name},
      {deployBranch: config.deployBranch},
    ),
  );
  const unsortedPackageStatuses = await getPackageStatuses(
    client,
    config,
    packageManifests,
    async (sinceCommitSha) => {
      const results: {associatedPullRequests: {number: number}[]}[] = [];
      for await (const commit of getAllCommitsCached()) {
        if (commit.oid === sinceCommitSha) {
          return results;
        }
        results.push(commit);
      }
      return results;
    },
  );

  if (config.canary !== null) {
    for (const pkg of unsortedPackageStatuses) {
      if (pkg.status === PackageStatus.NewVersionToBePublished) {
        pkg.newVersion = {
          ...pkg.newVersion,
          prerelease: [`canary-${config.canary}`],
        };
      }
    }
  }

  const sortResult = await sortPackages(unsortedPackageStatuses);

  if (sortResult.circular) {
    return {
      kind: PublishResultKind.CircularPackageDependencies,
      packageNames: sortResult.packageNames,
    };
  }

  const packageStatuses = sortResult.packages;

  config.logger.onValidatedPackages?.({
    packages: packageStatuses,
    dryRun: config.dryRun,
  });

  if (
    !packageStatuses.some(
      (pkg) => pkg.status === PackageStatus.NewVersionToBePublished,
    )
  ) {
    return {
      kind: PublishResultKind.NoUpdatesRequired,
      packages: packageStatuses as NoUpdateRequired[],
    };
  }

  // prepublish checks
  const gitHubPrepublishInfo = await checkGitHubReleaseStatus(config, client);
  if (!gitHubPrepublishInfo.ok) {
    return {
      kind: PublishResultKind.GitHubAuthCheckFail,
      reason: gitHubPrepublishInfo.reason,
    };
  }

  const packageVersions = new Map(
    packageStatuses.map((p) => [p.packageName, p.newVersion]),
  );
  const allTagNames = new Set(allTags.map((t) => t.name));

  const failures: PrepublishFailures['failures'][number][] = [];
  for (const pkg of packageStatuses) {
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

  for (const pkg of packageStatuses) {
    if (pkg.status === PackageStatus.NewVersionToBePublished) {
      await publishTarget(config, pkg, packageVersions, client);
    }
  }
  return {
    kind: PublishResultKind.UpdatesPublished,
    packages: packageStatuses,
  };
}
