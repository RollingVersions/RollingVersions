import GitHubClient from '@github-graph/api';
import {Repository} from 'rollingversions/lib/types';
import paginateBatched from 'rollingversions/lib/services/github/paginateBatched';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import * as queries from './github-graph';

export {GitHubClient};

export async function getRepository(client: GitHubClient, repo: Repository) {
  const repository = (await queries.getRepository(client, repo)).repository;
  if (!repository) {
    return null;
  }
  if (repository.databaseId === null) {
    throw new Error('Did not expect repository.databaseId to ever be null');
  }
  return {
    id: repository.databaseId,
    graphql_id: repository.id,
    owner: repo.owner,
    name: repo.name,
  };
}

export function getRepositoryPullRequestGraphIDs(
  client: GitHubClient,
  repo: Repository,
) {
  return paginateBatched(
    (token) =>
      queries.getRepositoryPullRequests(client, {
        owner: repo.owner,
        name: repo.name,
        after: token,
      }),
    (page) =>
      page.repository?.pullRequests.nodes?.filter(isTruthy).map((n) => n.id) ||
      [],
    (page) =>
      page.repository?.pullRequests.pageInfo.hasNextPage
        ? page.repository.pullRequests.pageInfo.endCursor || undefined
        : undefined,
  );
}
export async function getDefaultBranch(client: GitHubClient, repo: Repository) {
  const branch = (await queries.getDefaultBranch(client, repo)).repository
    ?.branch;
  if (!branch) {
    return null;
  }
  if (branch?.target.__typename !== 'Commit') {
    throw new Error(
      `Expected branch target to be "Commit" but got "${branch?.target.__typename}"`,
    );
  }
  return {
    name: branch.name,
    target: branch.target.oid,
    graphql_id: branch.id,
  };
}

export async function getRef(
  client: GitHubClient,
  repo: Repository,
  ref: GitReference,
) {
  const gitRef = (
    await queries.getRef(client, {
      ...repo,
      qualifiedName: getQualifiedName(ref),
    })
  ).repository?.ref;
  if (!gitRef) {
    return null;
  }
  if (gitRef?.target.__typename !== 'Commit') {
    throw new Error(
      `Expected ${ref.type} target to be "Commit" but got "${gitRef?.target.__typename}"`,
    );
  }
  return {
    name: gitRef.name,
    target: gitRef.target.oid,
    graphql_id: gitRef.id,
  };
}

export type GitReference = {type: 'head' | 'tag'; name: string};
function getQualifiedName({type, name}: GitReference): string {
  switch (type) {
    case 'head':
      return `refs/heads/${name}`;
    case 'tag':
      return `refs/tags/${name}`;
  }
}
export async function* getAllRefCommits(
  client: GitHubClient,
  repo: Repository,
  ref: GitReference,
) {
  for await (const result of paginateBatched(
    (token) =>
      queries.getAllRefCommits(client, {
        owner: repo.owner,
        name: repo.name,
        qualifiedName: getQualifiedName(ref),
        after: token,
      }),
    (page) =>
      page.repository?.ref?.target.__typename === 'Commit'
        ? page.repository.ref?.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.ref?.target.__typename === 'Commit' &&
      page.repository.ref.target.history.pageInfo.hasNextPage
        ? page.repository?.ref?.target.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export async function* getAllDefaultBranchCommits(
  client: GitHubClient,
  repo: Repository,
) {
  for await (const result of paginateBatched(
    (token) =>
      queries.getAllDefaultBranchCommits(client, {
        ...repo,
        after: token,
      }),
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit'
        ? page.repository.branch?.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit' &&
      page.repository.branch.target.history.pageInfo.hasNextPage
        ? page.repository?.branch?.target.history.pageInfo.endCursor ||
          undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export type GitHubCommit = {
  graphql_id: string;
  commit_sha: string;
  parents: string[];
  associatedPullRequests: {id: number; graphql_id: string}[];
};
function formatCommit(result: {
  id: string;
  oid: string;
  parents: {nodes: null | ({oid: string} | null)[]};
  associatedPullRequests: null | {
    nodes: null | (null | {databaseId: number | null; id: string})[];
  };
}): GitHubCommit {
  return {
    graphql_id: result.id,
    commit_sha: result.oid,
    parents: result.parents.nodes?.map((n) => n?.oid).filter(isTruthy) || [],
    associatedPullRequests:
      result.associatedPullRequests?.nodes
        ?.map((p) => {
          if (!p) return null;
          if (!p.databaseId) {
            throw new Error(
              `Expected pull request ${p.id} to have a databaseId`,
            );
          }
          return {id: p.databaseId, graphql_id: p.id};
        })
        .filter(isTruthy) || [],
  };
}

export async function getPullRequestFromGraphID(
  client: GitHubClient,
  graphql_id: string,
): Promise<PullRequestDetail | null> {
  const result = (
    await queries.getPullRequestFromGraphId(client, {id: graphql_id})
  ).node;
  if (!result) return null;
  if (result.__typename !== 'PullRequest') {
    throw new Error(`Expected a PullRequest but got ${result.__typename}`);
  }
  if (!result.databaseId) {
    throw new Error(`Got null for pull request databaseId`);
  }
  return {
    id: result.databaseId,
    graphql_id,
    number: result.number,
    title: result.title,
    is_merged: result.merged,
    is_closed: result.closed || result.merged,
    head_sha: result.headRef?.target.oid,
  };
}

export async function getPullRequestFromNumber(
  client: GitHubClient,
  repo: Repository,
  prNumber: number,
): Promise<PullRequestDetail | null> {
  const result = (
    await queries.getPullRequestFromNumber(client, {...repo, number: prNumber})
  ).repository?.pullRequest;
  if (!result) return null;
  if (!result.databaseId) {
    throw new Error(`Got null for pull request databaseId`);
  }
  return {
    id: result.databaseId,
    graphql_id: result.id,
    number: result.number,
    title: result.title,
    is_merged: result.merged,
    is_closed: result.closed || result.merged,
    head_sha: result.headRef?.target.oid,
  };
}

export interface PullRequestDetail {
  id: number;
  graphql_id: string;
  number: number;
  title: string;
  is_merged: boolean;
  is_closed: boolean;
  head_sha: string | undefined;
}
