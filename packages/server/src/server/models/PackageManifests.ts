import minimatch from 'minimatch';
import Cache from 'quick-lru';

import ChangeSet from '@rollingversions/change-set';
import {DEFAULT_CONFIG} from '@rollingversions/config';
import {
  Queryable,
  tables,
  DbGitCommit,
  DbGitRef,
  DbGitRepository,
  DbPullRequest,
} from '@rollingversions/db';
import {parseTag} from '@rollingversions/tag-format';
import {
  CurrentVersionTag,
  PackageManifest,
  VersioningMode,
  VersioningModeConfig,
  VersionTag,
} from '@rollingversions/types';
import {isPrerelease, max} from '@rollingversions/version-number';
import {eq as versionsEqual} from '@rollingversions/version-number';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

import {PullRequestPackage} from '../../types';
import groupByKey from '../../utils/groupByKey';
import type {Logger} from '../logger';
import {GitHubClient} from '../services/github';
import {
  getAllTags,
  getAllTagsOnBranch,
  getBranchHeadCommit,
  getPullRequestHeadCommit,
  isCommitReleased,
  updateRepoIfChanged,
} from './git';
import getRollingVersionsConfig from './PackageManifests/getRollingVersionsConfig';
import listPackages, {
  GetPackageManifestsResult,
} from './PackageManifests/listPackages';

export type PackageManifests = Map<string, PackageManifest>;

// `${git_repository_id}:${commit_sha}`
type CommitID = string;

const cache = new Cache<CommitID, Promise<GetPackageManifestsResult | null>>({
  maxSize: 30,
});

export async function getRollingVersionsConfigForBranch(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  source: {type: 'branch'; name: string},
  logger: Logger,
) {
  const commit = await getBranchHeadCommit(
    db,
    client,
    repo,
    source.name,
    logger,
  );
  if (!commit) {
    return null;
  }
  return await getRollingVersionsConfig(client, repo, commit.commit_sha);
}
export async function getPackageManifests(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  source:
    | {type: 'branch'; name: string}
    | {type: 'pull_request'; pullRequest: DbPullRequest}
    | {type: 'commit'; commit: DbGitCommit},
  logger: Logger,
) {
  const commit =
    source.type === 'commit'
      ? source.commit
      : source.type === `branch`
      ? await getBranchHeadCommit(db, client, repo, source.name, logger)
      : await getPullRequestHeadCommit(
          db,
          client,
          repo,
          source.pullRequest,
          logger,
        );
  if (!commit) {
    return null;
  }
  const id: CommitID = `${repo.id}:${commit.commit_sha}`;
  const cached = cache.get(id);
  if (cached) {
    return await cached;
  }
  try {
    const fresh = listPackages(client, repo, commit.commit_sha, logger);
    cache.set(id, fresh);
    const result = await fresh;
    if (result?.oid !== commit.commit_sha) {
      cache.delete(id);
    }
    return result;
  } catch (ex) {
    cache.delete(id);
    throw ex;
  }
}

async function getPackageManifestsForPullRequest(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  return (
    (await getPackageManifests(
      db,
      client,
      repo,
      {type: 'pull_request', pullRequest},
      logger,
    )) ||
    (await getPackageManifests(
      db,
      client,
      repo,
      {type: 'branch', name: repo.default_branch_name},
      logger,
    ))
  );
}

async function getChangeLogEntriesForPR(
  db: Queryable,
  pullRequest: DbPullRequest,
) {
  return await tables
    .change_log_entries(db)
    .find({pull_request_id: pullRequest.id})
    .orderByAsc(`sort_order_weight`)
    .all();
}
export function getPackageVersions({
  allowTagsWithoutPackageName,
  allTags,
  manifest,
}: {
  allowTagsWithoutPackageName: boolean;
  allTags: DbGitRef[];
  manifest: PackageManifest;
}) {
  return allTags
    .map((tag): VersionTag | null => {
      const version = parseTag(tag.name, {
        allowTagsWithoutPackageName,
        packageName: manifest.packageName,
        tagFormat: manifest.tag_format,
        versionSchema: manifest.version_schema,
      });
      return version && !isPrerelease(version)
        ? {commitSha: tag.commit_sha, name: tag.name, version}
        : null;
    })
    .filter(isTruthy);
}

async function mapMapValuesAsync<TKey, TValue, TMappedValue>(
  map: Map<TKey, TValue>,
  fn: (value: TValue) => Promise<TMappedValue>,
): Promise<Map<TKey, TMappedValue>> {
  return new Map(
    await Promise.all(
      [...map].map(async ([k, v]) => [k, await fn(v)] as const),
    ),
  );
}

export async function getDetailedPackageManifestsForPullRequest(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
): Promise<null | {
  packageErrors: {filename: string; error: string}[];
  packages: Map<string, PullRequestPackage>;
}> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const [
    getPackageManifestsResult,
    allTags,
    branchTags,
    changeLogEntries,
  ] = await Promise.all([
    getPackageManifestsForPullRequest(db, client, repo, pullRequest, logger),
    getAllTags(db, client, repo, logger),
    pullRequest.base_ref_name
      ? getBranchHeadCommit(
          db,
          client,
          repo,
          pullRequest.base_ref_name,
          logger,
        ).then(async (headCommit) =>
          headCommit ? await getAllTagsOnBranch(db, headCommit) : null,
        )
      : null,
    getChangeLogEntriesForPR(db, pullRequest),
  ]);
  if (!getPackageManifestsResult) {
    return null;
  }

  const {packages: manifests, packageErrors} = getPackageManifestsResult;

  const changes = groupByKey(changeLogEntries, (e) => e.package_name);

  const detailedManifests = await mapMapValuesAsync(
    manifests,
    async (manifest): Promise<PullRequestPackage> => {
      const allVersions = getPackageVersions({
        allowTagsWithoutPackageName: manifests.size <= 1,
        allTags,
        manifest,
      });
      const branchVersions = branchTags
        ? getPackageVersions({
            allowTagsWithoutPackageName: manifests.size <= 1,
            allTags: branchTags,
            manifest,
          })
        : null;
      const released =
        pullRequest.merge_commit_sha !== null &&
        (await isCommitReleased(db, repo, {
          commitShaToCheck: pullRequest.merge_commit_sha,
          releasedCommits: new Set(allVersions.map((v) => v.commitSha)),
        }));
      const changeSet: ChangeSet = (
        changes.get(manifest.packageName) ?? []
      ).map((c) => ({type: c.kind, title: c.title, body: c.body}));

      const currentVersion =
        branchVersions && pullRequest.base_ref_name
          ? getCurrentVersion({
              allVersions,
              branchVersions,
              versioningMode: manifest.versioning_mode,
              branchName: pullRequest.base_ref_name,
            })
          : {ok: false as const};
      return {
        manifest: {...manifest},
        currentVersion:
          currentVersion === null
            ? null
            : currentVersion.ok
            ? currentVersion
            : getMaxVersion(allVersions),
        changeSet,
        released,
      };
    },
  );

  for (const [packageName, changeLogEntries] of changes) {
    if (!detailedManifests.has(packageName)) {
      const changeSet: ChangeSet = changeLogEntries.map((c) => ({
        type: c.kind,
        title: c.title,
        body: c.body,
      }));
      detailedManifests.set(packageName, {
        manifest: {
          ...DEFAULT_CONFIG,
          customized: [],
          packageName,
          targetConfigs: [],
          dependencies: {development: [], required: [], optional: []},
          scripts: {pre_release: [], post_release: []},
        },
        currentVersion: null,
        changeSet,
        released: false,
      });
    }
  }

  return {packageErrors, packages: detailedManifests};
}

function getVersioningMode(
  versioningMode: VersioningModeConfig,
  branchName: string,
): VersioningMode {
  if (typeof versioningMode === 'string') {
    return versioningMode;
  }

  for (const {branch: branchPattern, mode} of versioningMode) {
    if (minimatch(branchName, branchPattern)) {
      return mode;
    }
  }

  return VersioningMode.Unambiguous;
}

function getMaxVersion(versions: readonly VersionTag[]) {
  return max(versions, (tag) => tag.version) ?? null;
}

export function getCurrentVersion({
  allVersions,
  branchVersions,
  branchName,
  versioningMode,
}: {
  allVersions: VersionTag[];
  branchVersions: VersionTag[];
  branchName: string;
  versioningMode: VersioningModeConfig;
}): CurrentVersionTag | null {
  const mode = getVersioningMode(versioningMode, branchName);
  const maxVersion = getMaxVersion(allVersions);
  const branchVersion = getMaxVersion(branchVersions);
  switch (mode) {
    case VersioningMode.AlwaysIncreasing:
      return maxVersion && {ok: true, ...maxVersion};
    case VersioningMode.ByBranch:
      return branchVersion && {ok: true, ...branchVersion};
    case VersioningMode.Unambiguous:
      if (
        branchVersion === maxVersion ||
        (branchVersion &&
          maxVersion &&
          versionsEqual(branchVersion.version, maxVersion.version))
      ) {
        return maxVersion && {ok: true, ...maxVersion};
      } else if (maxVersion) {
        return {ok: false, maxVersion, branchVersion};
      } else {
        throw new Error(
          `A branch version was found but no max version. This should never happen.`,
        );
      }
  }
}
