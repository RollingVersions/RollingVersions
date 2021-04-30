import Cache from 'quick-lru';

import ChangeSet from '@rollingversions/change-set';
import {Queryable, tables} from '@rollingversions/db';
import DbGitRef from '@rollingversions/db/git_refs';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';
import {parseTag} from '@rollingversions/tag-format';
import {isPrerelease, max} from '@rollingversions/version-number';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import type {PackageManifest, VersionTag} from 'rollingversions/lib/types';
import listPackages from 'rollingversions/lib/utils/listPackages';

import groupByKey from '../../utils/groupByKey';
import type {Logger} from '../logger';
import {getAllFiles, GitHubClient} from '../services/github';
import {
  getAllTags,
  getAllTagsOnBranch,
  getBranchHeadCommit,
  getPullRequestHeadCommit,
  getUnreleasedChanges,
  isCommitReleased,
  updateRepoIfChanged,
} from './git';

export type PackageManifests = Map<string, PackageManifest>;

// `${git_repository_id}:${commit_sha}`
type CommitID = string;

const cache = new Cache<
  CommitID,
  Promise<{oid: string; packages: Map<string, PackageManifest>} | null>
>({
  maxSize: 30,
});
async function getPackageManifestsUncached(
  client: GitHubClient,
  repo: DbGitRepository,
  source:
    | {type: 'branch'; name: string}
    | {type: 'pull_request'; pullRequest: DbPullRequest},
  _logger: Logger,
): Promise<null | {oid: string; packages: Map<string, PackageManifest>}> {
  const commitFiles = await getAllFiles(
    client,
    source.type === 'branch'
      ? {
          type: 'branch',
          repositoryID: repo.graphql_id,
          branchName: source.name,
        }
      : {type: 'pull_request', pullRequestID: source.pullRequest.graphql_id},
  );
  if (!commitFiles) {
    return null;
  }
  const packages = await listPackages(commitFiles.entries);

  return {oid: commitFiles.oid, packages};
}

export async function getPackageManifests(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  source:
    | {type: 'branch'; name: string}
    | {type: 'pull_request'; pullRequest: DbPullRequest},
  logger: Logger,
) {
  const commit =
    source.type === `branch`
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
    return (await cached)?.packages;
  }
  try {
    const fresh = getPackageManifestsUncached(client, repo, source, logger);
    cache.set(id, fresh);
    const result = await fresh;
    if (result?.oid !== commit.commit_sha) {
      cache.delete(id);
    }
    return result?.packages;
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
function getPackageVersions({
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
      });
      return version && !isPrerelease(version)
        ? {commitSha: tag.commit_sha, name: tag.name, version}
        : null;
    })
    .filter(isTruthy);
}

function getMaxVersion(versions: readonly VersionTag[]) {
  return max(versions, (tag) => tag.version) ?? null;
}

// function mapMapValues<TKey, TValue, TMappedValue>(
//   map: Map<TKey, TValue>,
//   fn: (value: TValue) => TMappedValue,
// ): Map<TKey, TMappedValue> {
//   return new Map([...map].map(([k, v]) => [k, fn(v)]));
// }
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
) {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const [manifests, allTags, changeLogEntries] = await Promise.all([
    getPackageManifestsForPullRequest(db, client, repo, pullRequest, logger),
    getAllTags(db, client, repo, logger),
    getChangeLogEntriesForPR(db, pullRequest),
  ]);
  if (!manifests) {
    return null;
  }

  const changes = groupByKey(changeLogEntries, (e) => e.package_name);

  const detailedManifests = await mapMapValuesAsync(
    manifests,
    async (manifest) => {
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
        manifest: {...manifest, versionTag: getMaxVersion(versions)},
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
          packageName,
          versionTag: null,
          targetConfigs: [],
          dependencies: {development: [], required: [], optional: []},
        },
        changeSet,
        released: false,
      });
    }
  }

  return detailedManifests;
}

export async function getDetailedPackageManifestsForBranch(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  {
    branchName,
    versionByBranch,
  }: {branchName: string; versionByBranch?: boolean},
  logger: Logger,
) {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const headCommit = await getBranchHeadCommit(
    db,
    client,
    repo,
    branchName,
    logger,
  );
  if (!headCommit) return null;
  const [manifests, tags] = await Promise.all([
    getPackageManifests(
      db,
      client,
      repo,
      {type: 'branch', name: branchName},
      logger,
    ),
    versionByBranch
      ? getAllTagsOnBranch(db, headCommit)
      : getAllTags(db, client, repo, logger),
  ]);
  if (!manifests) {
    return null;
  }

  return await mapMapValuesAsync(manifests, async (manifest) => {
    const versions = getPackageVersions({
      allowTagsWithoutPackageName: manifests.size <= 1,
      allTags: tags,
      manifest,
    });
    const changeSet: ChangeSet<{pr: number}> = (
      await getUnreleasedChanges(db, repo, {
        packageName: manifest.packageName,
        headCommitSha: headCommit.commit_sha,
        releasedCommits: new Set(versions.map((v) => v.commitSha)),
      })
    )
      .sort((a, b) => a.sort_order_weight - b.sort_order_weight)
      .map((c) => ({
        type: c.kind,
        title: c.title,
        body: c.body,
        pr: c.pr_number,
      }));
    return {
      manifest: {...manifest, versionTag: getMaxVersion(versions)},
      changeSet,
    };
  });
}

export function addPackageVersions<TPackageManifest extends PackageManifest>(
  packages: Map<string, TPackageManifest>,
  allTags: DbGitRef[],
): Map<string, TPackageManifest & {versionTag: VersionTag | null}> {
  return new Map(
    [...packages].map(([packageName, manifest]): [
      string,
      TPackageManifest & {versionTag: VersionTag | null},
    ] => {
      return [
        packageName,
        {
          ...manifest,
          versionTag: getMaxVersion(
            getPackageVersions({
              allowTagsWithoutPackageName: packages.size <= 1,
              allTags,
              manifest,
            }),
          ),
        },
      ];
    }),
  );
}
