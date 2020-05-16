import {
  PullRequest,
  PackageDependencies,
  ChangeSet,
  PackageManifestWithVersion,
} from 'rollingversions/lib/types';
import {
  Connection,
  getChangesForPullRequest,
  getCommitIdFromSha,
  isPullRequestReleased,
} from '../../services/postgres';
import {
  GitHubClient,
  getAllPullRequestCommits,
  GitHubCommit,
} from '../../services/github';
import addRepository from '../procedures/addRepository';
import upsertPullRequest from '../procedures/upsertPullRequest';
import upsertCommits from '../procedures/upsertCommits';
import getPackageManifests from '../procedures/getPackageManifests';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import addPackageVersions from 'rollingversions/lib/utils/addPackageVersions';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import log from '../../logger';

interface PullRequestPackage {
  manifests: PackageManifestWithVersion[];
  dependencies: PackageDependencies;
  changeSet: ChangeSet<{id: number; weight: number}>;
  released: boolean;
}

export default async function readPullRequestState(
  db: Connection,
  client: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
) {
  let start = Date.now();
  const repo = await addRepository(db, client, pullRequest.repo);

  log({
    event_type: 'add_repository',
    message: 'Ran add repository',
    event_status: 'ok',
    duration: Date.now() - start,
  });
  start = Date.now();

  const [{id, is_closed, is_merged, commentID}, head] = await Promise.all([
    upsertPullRequest(db, client, repo.id, repo, pullRequest.number),
    upsertCommits(
      db,
      client,
      repo.id,
      repo,
      getAllPullRequestCommits(client, repo, pullRequest.number),
    ),
  ] as const);
  log({
    event_type: 'upsert_pull_request',
    message: 'Ran upsert pull request',
    event_status: 'ok',
    duration: Date.now() - start,
  });

  start = Date.now();

  const [changes, packages] = await Promise.all([
    getChangesForPullRequest(db, id),
    getPackages(db, client, repo, head).then((packages) =>
      addPackageVersions(packages, repo.tags),
    ),
  ]);

  log({
    event_type: 'get_changes_and_manifests',
    message: 'Got change sets and package manifets',
    event_status: 'ok',
    duration: Date.now() - start,
  });
  start = Date.now();

  const changeSets = new Map<string, ChangeSet<{id: number; weight: number}>>();
  for (const change of changes) {
    let changeSet = changeSets.get(change.package_name);
    if (!changeSet) {
      changeSet = getEmptyChangeSet();
      changeSets.set(change.package_name, changeSet);
    }
    changeSet[change.kind].push({
      id: change.id,
      weight: change.sort_order_weight,
      title: change.title,
      body: change.body,
    });
  }

  const missingPackages = [
    ...new Set(
      changes.map((c) => c.package_name).filter((pn) => !packages.has(pn)),
    ),
  ].map((packagName): [
    string,
    {
      manifests: PackageManifestWithVersion[];
      dependencies: PackageDependencies;
    },
  ] => [
    packagName,
    {
      manifests: [],
      dependencies: {required: [], optional: [], development: []},
    },
  ]);
  try {
    return {
      id,
      repo,
      headSha: head?.commit_sha || null,
      commentID,
      is_closed,
      is_merged,
      packages: new Map<string, PullRequestPackage>(
        await Promise.all(
          [...packages, ...missingPackages].map(
            async ([packageName, metadata]): Promise<
              [string, PullRequestPackage]
            > => {
              const releasedCommits = new Set(
                metadata.manifests
                  .map(({versionTag}) => {
                    if (!versionTag) return undefined;
                    return repo.tags.find((t2) => t2.name === versionTag?.name);
                  })
                  .filter(isTruthy)
                  .map((versionTag) => versionTag.target_git_commit_id),
              );

              return [
                packageName,
                {
                  ...metadata,
                  changeSet: changeSets.get(packageName) || getEmptyChangeSet(),
                  released: await isPullRequestReleased(db, {
                    releasedCommitIDs: releasedCommits,
                    pullRequestID: id,
                  }),
                },
              ];
            },
          ),
        ),
      ),
    };
  } finally {
    log({
      event_type: 'get_registry_version',
      message: 'Got registry versions',
      event_status: 'ok',
      duration: Date.now() - start,
    });
  }
}

async function getPackages(
  db: Connection,
  client: GitHubClient,
  repo: {
    id: number;
    graphql_id: string;
    owner: string;
    name: string;
    head: {id: number; graphql_id: string} | undefined;
  },
  head?: GitHubCommit,
) {
  if (head) {
    const id = await getCommitIdFromSha(db, repo.id, head.commit_sha);
    if (id) {
      return getPackageManifests(db, client, repo, {
        id,
        graphql_id: head.graphql_id,
      });
    }
  }
  if (repo.head) {
    return getPackageManifests(db, client, repo, repo.head);
  }
  // TODO: report this error to users
  throw new Error('Could not find package manifests for this pull request');
}
