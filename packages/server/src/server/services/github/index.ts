import GitHubClient from '@github-graph/api';
import {Repository} from 'rollingversions/lib/types';
import paginate from 'rollingversions/lib/services/github/paginate';
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
  };
}

export async function* getAllDefaultBranchCommitsFromTail(
  client: GitHubClient,
  repo: Repository,
) {
  for await (const result of paginate(
    (token) =>
      queries.getAllDefaultBranchCommitsFromTail(client, {
        ...repo,
        before: token,
      }),
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit'
        ? page.repository.branch?.target.history.nodes || []
        : [],
    (page) =>
      page.repository?.branch?.target.__typename === 'Commit' &&
      page.repository.branch.target.history.pageInfo.hasNextPage
        ? page.repository?.branch?.target.history.pageInfo.startCursor ||
          undefined
        : undefined,
  )) {
    if (result) {
      yield result;
    }
  }
}
