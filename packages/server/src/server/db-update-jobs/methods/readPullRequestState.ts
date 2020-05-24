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
import readRepository from '../procedures/readRepository';

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
  const repo =
    (await readRepository(db, pullRequest.repo)) ||
    (await addRepository(db, client, pullRequest.repo, {
      refreshPRs: false,
      refreshTags: false,
    }));

  const [
    {id, is_closed, is_merged, commentID, submittedAtCommitSha},
    head,
  ] = await Promise.all([
    upsertPullRequest(db, client, repo.id, repo, pullRequest.number),
    upsertCommits(
      db,
      client,
      repo.id,
      repo,
      getAllPullRequestCommits(client, repo, pullRequest.number),
    ),
  ] as const);

  const [changes, packages] = await Promise.all([
    getChangesForPullRequest(db, id),
    getPackageManifestsForPr(db, client, repo, head).then((packages) =>
      addPackageVersions(packages, repo.tags),
    ),
  ]);

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
  return {
    id,
    repo,
    headSha: head?.commit_sha || null,
    submittedAtCommitSha,
    commentID,
    is_closed,
    is_merged,
    packages: new Map<string, PullRequestPackage>(
      await Promise.all(
        [...packages, ...missingPackages].map(
          async ([packageName, metadata]): Promise<
            [string, PullRequestPackage]
          > => {
            return [
              packageName,
              {
                ...metadata,
                changeSet: changeSets.get(packageName) || getEmptyChangeSet(),
                released:
                  is_merged &&
                  (await isPullRequestReleased(db, {
                    releasedCommitIDs: new Set(
                      metadata.manifests
                        .map(({versionTag}) => {
                          if (!versionTag) return undefined;
                          return repo.tags.find(
                            (t2) => t2.name === versionTag?.name,
                          );
                        })
                        .filter(isTruthy)
                        .map((versionTag) => versionTag.target_git_commit_id),
                    ),
                    pullRequestID: id,
                  })),
              },
            ];
          },
        ),
      ),
    ),
  };
}

async function getPackageManifestsForPr(
  db: Connection,
  client: GitHubClient,
  repo: {
    id: number;
    graphql_id: string;
    owner: string;
    name: string;
    head: {id: number; graphql_id: string} | undefined | null;
  },
  head?: GitHubCommit,
) {
  if (head) {
    // TODO: only use this head if the PR is open
    // (once we are able to display changes on packages that no longer exist)
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
