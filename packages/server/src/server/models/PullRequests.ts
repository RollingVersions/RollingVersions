import * as ft from 'funtypes';

import type {Queryable} from '@rollingversions/db';
import {tables} from '@rollingversions/db';
import type DbGitRepository from '@rollingversions/db/git_repositories';

import {Logger} from '../logger';
import {
  getPullRequestFromGraphID,
  getPullRequestFromNumber,
  getRepositoryPullRequestIDs,
  GitHubClient,
} from '../services/github';

export interface PayloadPullRequest {
  id: number;
  node_id: string;
  number: number;
  title: string;
  closed_at: null | string;
  merged_at: null | string;
  merge_commit_sha: null | string;
}

const PayloadPullRequestSchema: ft.Runtype<PayloadPullRequest> = ft.Object({
  id: ft.Number,
  node_id: ft.String,
  number: ft.Number,
  title: ft.String,
  closed_at: ft.Union(ft.Null, ft.String),
  merged_at: ft.Union(ft.Null, ft.String),
  merge_commit_sha: ft.Union(ft.Null, ft.String),
});

export async function upsertPullRequestFromPayload(
  db: Queryable,
  _client: GitHubClient,
  repo: DbGitRepository,
  pr: PayloadPullRequest,
  _logger: Logger,
) {
  PayloadPullRequestSchema.parse(pr);
  if (pr.merged_at && !pr.merge_commit_sha) {
    throw new Error(`Merged PR should have a merge_commit_sha`);
  }
  const [dbPR] = await tables.pull_requests(db).insertOrUpdate([`id`], {
    git_repository_id: repo.id,
    id: pr.id,
    graphql_id: pr.node_id,
    pr_number: pr.number,
    title: pr.title,
    is_closed: pr.closed_at !== null || pr.merged_at !== null,
    is_merged: pr.merged_at !== null,
    merge_commit_sha: pr.merge_commit_sha,
  });
  return dbPR;
}

export async function upsertPullRequestFromGraphQL(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  graphQlId: string,
  _logger: Logger,
) {
  const pr = await getPullRequestFromGraphID(client, graphQlId);
  if (!pr) {
    throw new Error(`Could not find the PR for GraphQL ID ${graphQlId}`);
  }
  if (pr.is_merged && !pr.merge_commit_sha) {
    throw new Error(`Merged PR should have a merge_commit_sha`);
  }
  const [dbPR] = await tables.pull_requests(db).insertOrUpdate([`id`], {
    git_repository_id: repo.id,
    id: pr.id,
    graphql_id: pr.graphql_id,
    pr_number: pr.number,
    title: pr.title,
    is_closed: pr.is_closed || pr.is_merged,
    is_merged: pr.is_merged,
    merge_commit_sha: pr.merge_commit_sha,
  });
  return dbPR;
}

export async function getPullRequestFromRestParams(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequestNumber: number,
  _logger: Logger,
) {
  const existingPR = await tables.pull_requests(db).findOne({
    git_repository_id: repo.id,
    pr_number: pullRequestNumber,
  });
  if (existingPR) {
    return existingPR;
  }
  const pr = await getPullRequestFromNumber(
    client,
    {
      owner: repo.owner,
      name: repo.name,
    },
    pullRequestNumber,
  );
  if (!pr) {
    return null;
  }
  const [dbPR] = await tables.pull_requests(db).insertOrUpdate([`id`], {
    git_repository_id: repo.id,
    id: pr.id,
    graphql_id: pr.graphql_id,
    pr_number: pr.number,
    title: pr.title,
    is_closed: pr.is_closed || pr.is_merged,
    is_merged: pr.is_merged,
    merge_commit_sha: pr.merge_commit_sha,
  });
  return dbPR;
}

export async function refreshPullRequests(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
) {
  const timer = logger.withTimer();
  const existingPullRequests = new Set(
    (
      await tables
        .pull_requests(db)
        .find({
          git_repository_id: repo.id,
        })
        .select(`id`)
        .all()
    ).map((pr) => pr.id),
  );
  for await (const pullRequestIDs of getRepositoryPullRequestIDs(
    client,
    repo,
  )) {
    const newPullRequests = pullRequestIDs.filter(
      ({id}) => !existingPullRequests.has(id),
    );
    await Promise.all(
      newPullRequests.map(({graphql_id}) =>
        upsertPullRequestFromGraphQL(db, client, repo, graphql_id, logger),
      ),
    );
  }
  timer.info('read_pull_requests', 'Read all pull request IDs');
  await refreshPullRequestMergeCommits(db, client, repo, logger);
}

export async function refreshPullRequestMergeCommits(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
) {
  const timer = logger.withTimer();
  for (const pr of await tables
    .pull_requests(db)
    .find({
      git_repository_id: repo.id,
      is_merged: true,
      merge_commit_sha: null,
    })
    .all()) {
    await upsertPullRequestFromGraphQL(db, client, repo, pr.graphql_id, logger);
  }
  timer.info(
    'refresh_pr_merge_commits',
    `Added all missing merge commit references for ${repo.owner}/${repo.name}`,
  );
}