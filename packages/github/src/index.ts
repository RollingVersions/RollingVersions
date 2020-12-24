import {URL} from 'url';
import GitHubClient from '@github-graph/api';
import {getNodeMethod, hasTypeName, methodHelpers} from './utils';
import * as g from './github-graph';

export type {GitHubClient};

export const getRepositoryByName = methodHelpers(g.getRepositoryByName)
  .key('repository')
  .method();

export const getDefaultBranchName = getNodeMethod(
  g.getDefaultBranchName,
  'Repository',
)
  .key('branch')
  .key('name')
  .method();

export const getPullRequest = getNodeMethod(
  g.getPullRequest,
  'PullRequest',
).method();

export const getPullRequestByNumber = methodHelpers(g.getPullRequestByNumber)
  .key('node')
  .type('Repository')
  .key('pullRequest')
  .method();

export const getRefByQualifiedName = methodHelpers(g.getRefByQualifiedName)
  .key('node')
  .type('Repository')
  .key('ref')
  .method();

export type PullRequestsPage = g.GetOpenPullRequests_node_Repository_pullRequests;
export const getOpenPullRequests = methodHelpers(g.getOpenPullRequests)
  .key('node')
  .type('Repository')
  .key('pullRequests')
  .method();

export type CommitHistory = g.GetCommitHistory_node_Commit_history;
export const getCommitHistory = methodHelpers(g.getCommitHistory)
  .key('node')
  .type('Commit')
  .key('history')
  .method();

export type DeepCommitResolve<T> = T extends {__typename: 'Commit'}
  ? T
  : T extends {
      target: infer Target;
    }
  ? DeepCommitResolve<Target>
  : undefined;
export interface Target {
  __typename: string;
  target?: Target;
}
export function resolveTargetCommit<T extends Target>(
  target: T,
): undefined | DeepCommitResolve<T> {
  let t: Target | undefined = target;
  while (hasTypeName(t)) {
    if (t.__typename === 'Commit') {
      // @ts-expect-error - very complex type inference here
      return t;
    }
    t = t.target;
  }
  return undefined;
}

export const getRefs = methodHelpers(g.getRefs)
  .key('node')
  .type('Repository')
  .key('refs')
  .method();

export const createComment = methodHelpers(
  async (
    client,
    {owner, name, pr_number}: {owner: string; name: string; pr_number: number},
    body: string,
  ) => {
    const res = await client.rest.issues.createComment({
      owner: owner,
      repo: name,
      issue_number: pr_number,
      body,
    });
    return res.data.id;
  },
).method({retries: 0});

export const updateComment = methodHelpers(
  async (
    client,
    {
      owner,
      name,
      pr_number,
      comment_id,
    }: {owner: string; name: string; pr_number: number; comment_id: number},
    body: string,
  ) => {
    await client.rest.issues.updateComment({
      comment_id,
      owner: owner,
      repo: name,
      issue_number: pr_number,
      body,
    });
  },
).method();

export const deleteComment = methodHelpers(
  async (
    client,
    {
      owner,
      name,
      comment_id,
    }: {owner: string; name: string; comment_id: number},
  ) => {
    await client.rest.issues.deleteComment({
      owner: owner,
      repo: name,
      comment_id: comment_id,
    });
  },
).method();

export const setCommitStatus = methodHelpers(
  async (
    client,
    {owner, name, sha}: {owner: string; name: string; sha: string},
    status: {
      state: 'success' | 'pending' | 'error' | 'failure';
      url: URL;
      description: string;
    },
  ) => {
    await client.rest.repos.createStatus({
      owner: owner,
      repo: name,
      sha: sha,
      state: status.state,
      target_url: status.url.href,
      description: status.description,
      context: 'RollingVersions',
    });
  },
).method();
