import {PackageManifest, PublishConfig} from '../types';
import {
  GitHubClient,
  auth,
  getAllTags,
  getAllCommits,
} from '../services/github';
import {getAllFiles} from '../services/git';
import createChangeSetLoader from '../utils/createChangeSetLoader';
import sortPackages from '../utils/sortPackages';
import {checkGitHubReleaseStatus} from '../PublishTargets/github';
import {prepublish, publish as publishTarget} from '../PublishTargets';
import listPackages from '../utils/listPackages';
import splitAsyncGenerator from '../ts-utils/splitAsyncGenerator';
import getStateFromPullRequestComment from '../utils/getStateFromPullRequestComment';
import createPackageVersionLoader from '../utils/createPackageVersionLoader';
import {parseVersionTagTemplate} from '../utils/VersionTagTemplate';
import findMax from '../ts-utils/findMax';
import {gt, prerelease} from 'semver';
import {getNewVersion} from '../utils/Versioning';
import {PackageToRelease, PackageWithNoChanges} from '../types/publish';
import Release from '../types/Release';

interface PackageWithMissingTag {
  pkg: PackageManifest;
  versionsWithoutTags: string[];
}

export enum PublishResultKind {
  NoUpdatesRequired,
  UpdatesPublished,
  CircularPackageDependencies,
  GitHubAuthCheckFail,
  PrepublishFailures,
}
export interface NoUpdatesRequired {
  readonly kind: PublishResultKind.NoUpdatesRequired;
  readonly packagesWithNoChanges: readonly PackageWithNoChanges[];
}
export interface UpdatesPublished {
  readonly kind: PublishResultKind.UpdatesPublished;
  readonly packagesWithNoChanges: readonly PackageWithNoChanges[];
  readonly releasedPackages: readonly PackageToRelease[];
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
    readonly pkg: PackageManifest;
    readonly release: Release;
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

  const [unsortedPackageManifests, allTags] = await Promise.all([
    listPackages(getAllFiles(config.dirname)),
    getAllTags(client, {owner: config.owner, name: config.name}),
  ]);
  const sortResult = sortPackages([...unsortedPackageManifests.values()]);
  if (sortResult.circular) {
    return {
      kind: PublishResultKind.CircularPackageDependencies,
      packageNames: sortResult.packageNames,
    };
  }
  const packageManifests = sortResult.packages;

  const getAllCommitsCached = splitAsyncGenerator(
    getAllCommits(
      client,
      {owner: config.owner, name: config.name},
      {deployBranch: config.deployBranch},
    ),
  );

  const {
    getVersionTagsForPackage,
    getNextTagForPackage,
  } = createPackageVersionLoader<
    {
      packageName: string;
      tagFormat?: string;
    },
    {
      commitSha: string;
      name: string;
    }
  >({
    tags: allTags,
    packageCount: packageManifests.length,
    getPackageName: (pkg) => pkg.packageName,
    getTagName: (tag) => tag.name,
    getTagTemplate: (pkg) =>
      pkg.tagFormat ? parseVersionTagTemplate(pkg.tagFormat) : null,
  });

  const getChangeSet = createChangeSetLoader<
    {lastCommitSha: string | null; packageName: string},
    number,
    {pr: number}
  >({
    getPullRequestID(pr) {
      return pr;
    },
    getPullRequestContext(pr) {
      return {pr};
    },
    async getUnreleasedPullRequests(pkg) {
      const results: number[] = [];
      for await (const commit of getAllCommitsCached()) {
        if (commit.oid === pkg.lastCommitSha) {
          return results;
        }
        results.push(...commit.associatedPullRequests.map((pr) => pr.number));
      }
      return results;
    },
    async getChangeSetForPullRequest(prNumber) {
      const state = await getStateFromPullRequestComment(client, {
        number: prNumber,
        repo: {owner: config.owner, name: config.name},
      });
      return (pkg) => {
        if (state) {
          return state.packages.get(pkg.packageName) ?? null;
        } else {
          return null;
        }
      };
    },
  });

  const packageDetails = await Promise.all(
    packageManifests.map(async (pkg) => {
      const versionTags = getVersionTagsForPackage(pkg);
      const registryVersions = [...(await getRegistryVersions(pkg))];

      const currentVersionTag = findMax(versionTags, (a, b) =>
        gt(a.versionString, b.versionString) ? a : b,
      );
      const versionsWithoutTags = registryVersions.filter(
        (v) =>
          !prerelease(v) &&
          (currentVersionTag === undefined ||
            gt(v, currentVersionTag.versionString)),
      );

      const changeSet = await getChangeSet({
        lastCommitSha: currentVersionTag?.tag.commitSha ?? null,
        packageName: pkg.packageName,
      });

      const newVersion = getNewVersion(
        currentVersionTag?.versionString ?? null,
        changeSet,
      );

      return {
        pkg,
        oldVersion: currentVersionTag?.versionString ?? null,
        newVersion:
          newVersion && config.canary
            ? `${newVersion}-canary-${config.canary}`
            : newVersion,
        tagName:
          newVersion && !config.canary
            ? getNextTagForPackage(pkg, newVersion)
            : null,
        changeSet,
        versionsWithoutTags,
      };
    }),
  );

  let packagesToRelease: PackageToRelease[] = packageDetails
    .filter((p) => p.newVersion !== null)
    .map(({pkg, oldVersion, newVersion, tagName, changeSet}) => ({
      pkg,
      release: {
        oldVersion,
        newVersion: newVersion!,
        tagName,
        changeSet,
      },
    }));
  const packagesWithNoChanges: PackageWithNoChanges[] = packageDetails
    .filter((p) => p.newVersion === null)
    .map(({pkg, oldVersion}) => ({pkg, version: oldVersion}));
  const packagesWithMissingTags: PackageWithMissingTag[] = packageDetails
    .filter((p) => p.versionsWithoutTags.length !== 0)
    .map(({pkg, versionsWithoutTags}) => ({pkg, versionsWithoutTags}));

  const versions = new Map(
    packageDetails.map(({pkg, newVersion, oldVersion}) => [
      pkg.packageName,
      newVersion ?? oldVersion,
    ]),
  );

  if (packagesWithMissingTags.length) {
    // TODO: provide flag to treat this as a warning, to allow publishing a v1.0.1 release on the v1.x.x branch even though the main branch is on v2.0.0
    return {
      kind: PublishResultKind.MissingTags,
      packages: packagesWithMissingTags,
    };
  }

  config.logger.onValidatedPackages?.({
    packagesToRelease,
    packagesWithNoChanges,
    dryRun: config.dryRun,
  });

  if (!packagesToRelease.length) {
    return {
      kind: PublishResultKind.NoUpdatesRequired,
      packagesWithNoChanges,
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

  const failures: PrepublishFailures['failures'][number][] = [];
  for (const {pkg, release} of packagesToRelease) {
    const reasons = [];
    if (release.tagName && allTags.some((t) => t.name === release.tagName)) {
      reasons.push(`A github release already exists for ${release.tagName}`);
    }
    for (const prepublishResult of await prepublish(
      config,
      pkg,
      release,
      versions,
    )) {
      if (!prepublishResult.ok) {
        reasons.push(prepublishResult.reason);
      }
    }
    if (reasons.length) {
      failures.push({pkg, release, reasons});
    }
  }

  if (failures.length) {
    return {
      kind: PublishResultKind.PrepublishFailures,
      failures,
    };
  }

  for (const {pkg, release} of packagesToRelease) {
    await publishTarget(config, pkg, release, versions, client);
  }
  return {
    kind: PublishResultKind.UpdatesPublished,
    packagesWithNoChanges,
    releasedPackages: packagesToRelease,
  };
}
