import Cache from 'quick-lru';

import ChangeSet from '@rollingversions/change-set';
import {DEFAULT_CONFIG} from '@rollingversions/config';
import {Queryable, tables} from '@rollingversions/db';
import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRef from '@rollingversions/db/git_refs';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';
import {parseTag} from '@rollingversions/tag-format';
import {PackageManifest, VersionTag} from '@rollingversions/types';
import {isPrerelease, max} from '@rollingversions/version-number';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

import {PullRequestPackage} from '../../types';
import groupByKey from '../../utils/groupByKey';
import type {Logger} from '../logger';
import {GitHubClient} from '../services/github';
import {
  fetchTree,
  getAllTags,
  getBranchHeadCommit,
  getPullRequestHeadCommit,
  isCommitReleased,
  updateRepoIfChanged,
} from './git';
import listPackages from './PackageManifests/listPackages';

export type PackageManifests = Map<string, PackageManifest>;

// `${git_repository_id}:${commit_sha}`
type CommitID = string;

type GetPackageManifestsResult = {
  oid: string;
  packages: Map<string, PackageManifest>;
  packageErrors: {filename: string; error: string}[];
};
const cache = new Cache<CommitID, Promise<GetPackageManifestsResult | null>>({
  maxSize: 30,
});
async function getPackageManifestsUncached(
  _client: GitHubClient,
  repo: DbGitRepository,
  _source:
    | {type: 'branch'; name: string}
    | {type: 'pull_request'; pullRequest: DbPullRequest}
    | {type: 'commit'; commit: DbGitCommit},
  commit: DbGitCommit,
  logger: Logger,
): Promise<null | GetPackageManifestsResult> {
  const commitFiles = {
    entries: await fetchTree(repo, commit.commit_sha, logger),
    oid: commit.commit_sha,
  };
  const {packages, packageErrors} = await listPackages(commitFiles.entries);

  return {oid: commitFiles.oid, packages, packageErrors};
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
    const fresh = getPackageManifestsUncached(
      client,
      repo,
      source,
      commit,
      logger,
    );
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
        tagFormat: manifest.tagFormat,
        versionSchema: manifest.versionSchema,
      });
      return version && !isPrerelease(version)
        ? {commitSha: tag.commit_sha, name: tag.name, version}
        : null;
    })
    .filter(isTruthy);
}

export function getMaxVersion(versions: readonly VersionTag[]) {
  return max(versions, (tag) => tag.version) ?? null;
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
    changeLogEntries,
  ] = await Promise.all([
    getPackageManifestsForPullRequest(db, client, repo, pullRequest, logger),
    getAllTags(db, client, repo, logger),
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
      const versions = getPackageVersions({
        allowTagsWithoutPackageName: manifests.size <= 1,
        allTags,
        manifest,
      });
      const released =
        pullRequest.merge_commit_sha !== null &&
        (await isCommitReleased(db, repo, {
          commitShaToCheck: pullRequest.merge_commit_sha,
          releasedCommits: new Set(versions.map((v) => v.commitSha)),
        }));
      const changeSet: ChangeSet = (
        changes.get(manifest.packageName) ?? []
      ).map((c) => ({type: c.kind, title: c.title, body: c.body}));
      return {
        manifest: {...manifest},
        currentVersion: getMaxVersion(versions),
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
        },
        currentVersion: null,
        changeSet,
        released: false,
      });
    }
  }

  return {packageErrors, packages: detailedManifests};
}
