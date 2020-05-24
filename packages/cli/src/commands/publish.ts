import {PublishConfig} from '../types';
import {
  GitHubClient,
  auth,
  getAllTags,
  getAllCommits,
} from '../services/github';
import {getAllFiles} from '../services/git';
import getPackageStatuses, {
  NoUpdateRequired,
  SuccessPackageStatus,
  MissingTag,
  NewVersionToBePublished,
  PackageStatus,
  isPackageStatus,
} from '../utils/getPackageStatuses';
import sortPackages from '../utils/sortPackages';
import {checkGitHubReleaseStatus} from '../PublishTargets/github';
import getNewTagName from '../utils/getNewTagName';
import {prepublish, publish as publishTarget} from '../PublishTargets';
import notFn from '../ts-utils/notFn';
import arrayEvery from '../ts-utils/arrayEvery';
import orFn from '../ts-utils/orFn';
import listPackages from '../utils/listPackages';
import splitAsyncGenerator from '../ts-utils/splitAsyncGenerator';
import addPackageVersions from '../utils/addPackageVersions';

export enum PublishResultKind {
  NoUpdatesRequired,
  UpdatesPublished,
  MissingTags,
  CircularPackageDependencies,
  GitHubAuthCheckFail,
  PrepublishFailures,
}
export interface NoUpdatesRequired {
  readonly kind: PublishResultKind.NoUpdatesRequired;
  readonly packages: readonly NoUpdateRequired[];
}
export interface UpdatesPublished {
  readonly kind: PublishResultKind.UpdatesPublished;
  readonly packages: readonly SuccessPackageStatus[];
}
export interface MissingTags {
  readonly kind: PublishResultKind.MissingTags;
  readonly packages: readonly MissingTag[];
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
  | MissingTags
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
  const packageManifests = await addPackageVersions(
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

  if (config.canary) {
    for (const pkg of unsortedPackageStatuses) {
      if (pkg.status === PackageStatus.NewVersionToBePublished) {
        pkg.newVersion = `${pkg.newVersion}-canary-${config.canary}`;
      }
    }
  }

  const isSuccessPackageStatus = orFn(
    isPackageStatus(PackageStatus.NewVersionToBePublished),
    isPackageStatus(PackageStatus.NoUpdateRequired),
  );
  if (!arrayEvery(unsortedPackageStatuses, isSuccessPackageStatus)) {
    return {
      kind: PublishResultKind.MissingTags,
      packages: unsortedPackageStatuses.filter(notFn(isSuccessPackageStatus)),
    };
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

  const failures: PrepublishFailures['failures'][number][] = [];
  for (const pkg of packageStatuses) {
    if (pkg.status === PackageStatus.NewVersionToBePublished) {
      const reasons = [];
      const tagName = getNewTagName(packageStatuses, pkg);
      if (gitHubPrepublishInfo.tags.includes(tagName)) {
        reasons.push(`A github release already exists for ${tagName}`);
      }
      for (const prepublishResult of await prepublish(
        config,
        pkg,
        packageVersions,
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
      await publishTarget(config, pkg, {
        packageVersions,
        packageStatuses,
        client,
      });
    }
  }
  return {
    kind: PublishResultKind.UpdatesPublished,
    packages: packageStatuses,
  };
}
