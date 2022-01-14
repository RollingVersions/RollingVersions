import GitHubClient, {
  auth,
  OptionsWithAuth as GitHubOptions,
} from '@github-graph/api';
import retry, {withRetry} from 'then-retry';

import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRepository from '@rollingversions/db/git_repositories';
import {PullRequest, Repository} from '@rollingversions/types';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

import paginateBatched from '../../../utils/paginateBatched';
import * as queries from './github-graph';

export {GitHubClient};
export {auth};
export type {GitHubOptions};

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
    isPrivate: repository.isPrivate,
    defaultBranch: repository.defaultBranchRef?.name,
  };
}

export function getRepositoryPullRequestIDs(
  client: GitHubClient,
  repo: Repository,
) {
  const nameWithOwner = `${repo.owner}/${repo.name}`;
  return paginateBatched(
    (token) =>
      queries.getRepositoryPullRequests(client, {
        owner: repo.owner,
        name: repo.name,
        after: token,
      }),
    (page) =>
      page.repository?.pullRequests.nodes
        ?.filter(isTruthy)
        .filter((n) => n.baseRepository?.nameWithOwner === nameWithOwner)
        .map((n) => ({
          id: n.databaseId!,
          graphql_id: n.id,
        })) || [],
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
  if (branch.target.__typename !== 'Commit') {
    throw new Error(
      `Expected branch target to be "Commit" but got "${branch.target.__typename}"`,
    );
  }
  return {
    name: branch.name,
    target: {
      graphql_id: branch.target.id,
      commit_sha: branch.target.oid,
    },
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
  const target =
    gitRef.target.__typename === 'Commit'
      ? gitRef.target
      : gitRef.target.__typename === 'Tag'
      ? gitRef.target.target.__typename === 'Commit'
        ? gitRef.target.target
        : null
      : null;
  if (target?.__typename !== 'Commit') {
    throw new Error(`Expected ${ref.type} target to be "Commit".`);
  }
  return {
    name: gitRef.name,
    target: target.oid,
    targetGraphID: target.id,
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
export async function* getCommitHistory(
  client: GitHubClient,
  commitID: string,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPageSize = pageSize;
      pageSize = Math.min(100, pageSize + 20);
      return await retry(() =>
        queries.getAllCommitHistory(client, {
          commitID,
          pageSize: currentPageSize,
          after: token,
        }),
      );
    },
    (page) => {
      if (page.node?.__typename !== 'Commit') {
        throw new Error(
          `Expected a Commit but got ${page.node?.__typename || 'undefined'}`,
        );
      }
      return page.node.__typename === 'Commit'
        ? page.node.history.nodes || []
        : [];
    },
    (page) =>
      page.node?.__typename === 'Commit' &&
      page.node.history.pageInfo.hasNextPage
        ? page.node.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export async function* getAllRefCommits(
  client: GitHubClient,
  repo: Repository,
  ref: GitReference,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPageSize = pageSize;
      pageSize = Math.min(100, pageSize + 20);
      return await retry(() =>
        queries.getAllRefCommits(client, {
          owner: repo.owner,
          name: repo.name,
          qualifiedName: getQualifiedName(ref),
          pageSize: currentPageSize,
          after: token,
        }),
      );
    },
    (page) =>
      page.repository?.ref?.target.__typename === 'Commit'
        ? page.repository.ref.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.ref?.target.__typename === 'Commit' &&
      page.repository.ref.target.history.pageInfo.hasNextPage
        ? page.repository.ref.target.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export async function* getAllDefaultBranchCommits(
  client: GitHubClient,
  repo: Repository,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPageSize = pageSize;
      pageSize = Math.min(100, pageSize + 20);
      return await queries.getAllDefaultBranchCommits(client, {
        ...repo,
        pageSize: currentPageSize,
        after: token,
      });
    },
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit'
        ? page.repository.branch.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit' &&
      page.repository.branch.target.history.pageInfo.hasNextPage
        ? page.repository.branch.target.history.pageInfo.endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}
export type GitHubCommit = {
  graphql_id: string;
  commit_sha: string;
  parents: string[];
  associatedPullRequests: {
    id: number;
    graphql_id: string;
    repositoryId: number | null;
  }[];
};
function formatCommit(result: {
  id: string;
  oid: string;
  parents: {nodes: null | ({oid: string} | null)[]};
  associatedPullRequests: null | {
    nodes:
      | null
      | (null | {
          databaseId: number | null;
          id: string;
          repository: {databaseId: number | null};
        })[];
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
          return {
            id: p.databaseId,
            graphql_id: p.id,
            repositoryId: p.repository.databaseId,
          };
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
    merge_commit_sha: result.mergeCommit?.oid ?? null,
    head_ref_name: result.headRefName,
    base_ref_name: result.baseRefName,
  };
}

export async function getPullRequestFromNumber(
  client: GitHubClient,
  repo: Repository,
  prNumber: number,
): Promise<PullRequestDetail | null> {
  const result = (
    await queries.getPullRequestFromNumber(client, {
      owner: repo.owner,
      name: repo.name,
      number: prNumber,
    })
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
    merge_commit_sha: result.mergeCommit?.oid ?? null,
    head_ref_name: result.headRefName,
    base_ref_name: result.baseRefName,
  };
}
export async function* getAllPullRequestCommits(
  client: GitHubClient,
  repo: Repository,
  prNumber: number,
) {
  let pageSize = 5;
  for await (const result of paginateBatched(
    async (token) => {
      const currentPagesize = pageSize;
      pageSize = Math.min(100, pageSize + 5);
      return await queries.getAllPullRequestCommits(client, {
        owner: repo.owner,
        name: repo.name,
        number: prNumber,
        pageSize: currentPagesize,
        after: token,
      });
    },
    (page) =>
      page.repository?.pullRequest?.headRef?.target.__typename === 'Commit'
        ? page.repository.pullRequest.headRef.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.pullRequest?.headRef?.target.__typename === 'Commit' &&
      page.repository.pullRequest.headRef.target.history.pageInfo.hasNextPage
        ? page.repository.pullRequest.headRef.target.history.pageInfo
            .endCursor || undefined
        : undefined,
  )) {
    yield result.filter(isTruthy).map(formatCommit);
  }
}

export interface PullRequestDetail {
  id: number;
  graphql_id: string;
  number: number;
  title: string;
  is_merged: boolean;
  is_closed: boolean;
  merge_commit_sha: string | null;
  head_ref_name: string;
  base_ref_name: string;
}

export const updateCommitStatus = withRetry(
  async (
    client: GitHubClient,
    repo: DbGitRepository,
    headCommit: DbGitCommit,
    status: {
      state: 'success' | 'pending' | 'error' | 'failure';
      url: URL;
      description: string;
    },
  ) => {
    await client.rest.repos.createStatus({
      owner: repo.owner,
      repo: repo.name,
      sha: headCommit.commit_sha,
      state: status.state,
      target_url: status.url.href,
      description: status.description,
      context: 'RollingVersions',
    });
  },
);

export async function writeComment(
  client: GitHubClient,
  pr: PullRequest,
  body: string,
  existingComment: number | undefined,
) {
  if (existingComment) {
    return (
      await retry(() =>
        client.rest.issues.updateComment({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          body,
          comment_id: existingComment,
        }),
      )
    ).data.id;
  } else {
    return (
      await client.rest.issues.createComment({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        issue_number: pr.number,
        body,
      })
    ).data.id;
  }
}

export const deleteComment = withRetry(
  async (client: GitHubClient, pr: PullRequest, existingComment: number) => {
    await client.rest.issues.deleteComment({
      owner: pr.repo.owner,
      repo: pr.repo.name,
      comment_id: existingComment,
    });
  },
);

async function pullRequest<T>(
  promise: Promise<
    {repository?: null | {pullRequest?: null | T}} | null | undefined
  >,
): Promise<T | null> {
  return await promise.then(
    (result) => {
      return result?.repository?.pullRequest || null;
    },
    (ex) => {
      try {
        if (
          ex &&
          ex.errors &&
          Array.isArray(ex.errors) &&
          ex.errors.some(
            (e: any) =>
              e &&
              e.type === 'NOT_FOUND' &&
              Array.isArray(e.path) &&
              e.path.length === 2 &&
              e.path[0] === 'repository' &&
              e.path[0] === 'pullRequest',
          )
        ) {
          return null;
        }
      } catch {
        // fallthrough
      }
      throw ex;
    },
  );
}

export const getPullRequestStatus = withRetry(
  async (client: GitHubClient, pr: PullRequest) => {
    return (
      (await pullRequest(
        queries.getPullRequestStatus(client, {
          owner: pr.repo.owner,
          name: pr.repo.name,
          number: pr.number,
        }),
      )) || undefined
    );
  },
);

export const getPullRequestAuthor = withRetry(
  async (client: GitHubClient, pr: PullRequest) => {
    return (
      (
        await pullRequest(
          queries.getPullRequestAuthor(client, {
            owner: pr.repo.owner,
            name: pr.repo.name,
            number: pr.number,
          }),
        )
      )?.author || null
    );
  },
);

export const getViewer = withRetry(async (client: GitHubClient) => {
  return (await queries.getViewer(client)).viewer;
});

export const getRepositoryIsPublic = withRetry(
  async (client: GitHubClient, repo: Repository) => {
    return (
      (
        await queries.getRepositoryIsPrivate(client, {
          owner: repo.owner,
          name: repo.name,
        })
      ).repository?.isPrivate === false
    );
  },
);

export const getRepositoryViewerPermissions = withRetry(
  async (client: GitHubClient, repo: Repository) => {
    return (
      (await queries.getRepositoryViewerPermissions(client, repo)).repository
        ?.viewerPermission || null
    );
  },
  {
    shouldRetry: (_e, failedAttempts) => failedAttempts < 3,
    retryDelay: () => 100,
  },
);

export async function getRelease(
  client: GitHubClient,
  params: {
    owner: string;
    name: string;
    tagName: string;
  },
): Promise<{
  createdAt: Date;
  name: string;
  description: string;
} | null> {
  const result = (
    await queries.getRelease(client, {
      owner: params.owner,
      name: params.name,
      tagName: params.tagName,
    })
  ).repository?.release;
  return result
    ? {
        createdAt: new Date(result.createdAt),
        name: result.name ?? params.tagName,
        description: result.description ?? ``,
      }
    : null;
}
