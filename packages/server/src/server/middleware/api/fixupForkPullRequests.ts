import db, {q, tables} from '@rollingversions/db';

import {getClientForRepo} from '../../getClient';
import logger from '../../logger';
import {getRepositoryPullRequestIDs} from '../../services/github';

export default async function fixupForkPullRequests(after?: string) {
  const start = Date.now();
  let repositories = await tables
    .git_repositories(db)
    .find({uninstalled_at: null})
    .orderByAsc('owner')
    .orderByAsc('name')
    .all();

  if (after) {
    const [owner, name] = after.split(`/`);
    repositories = repositories.filter(
      (r) => r.owner > owner || (r.owner === owner && r.name > name),
    );
  }

  const checkedRepos: string[] = [];
  const errors: string[] = [];
  const pullRequestsToRemove: {url: string; title: string}[] = [];
  let currentOwner = null;
  let currentRepo = null;
  for (const repo of repositories) {
    if (Date.now() - start > 10_000) {
      break;
    }
    currentOwner = repo.owner;
    currentRepo = repo.name;
    checkedRepos.push(`${repo.owner}/${repo.name}`);

    const client = await getClientForRepo({
      owner: repo.owner,
      name: repo.name,
    }).catch(async (ex: any) => {
      errors.push(
        `Error getting client for ${repo.owner}/${repo.name}: ${ex.message}`,
      );
      logger.warning(
        `uninstalled_repo`,
        `Uninstalled ${repo.owner}/${repo.name}`,
        {
          repo_owner: repo.owner,
          repo_name: repo.name,
          error_message: ex.message,
          error_code: `${ex.code || `null`}`,
          error_status: `${ex.status || `null`}`,
          error_statusCode: `${ex.statusCode || `null`}`,
        },
      );
      if (
        ex.message === `This installation has been suspended` ||
        ex.message === `Not Found`
      ) {
        await tables
          .git_repositories(db)
          .update({id: repo.id}, {uninstalled_at: new Date()});
      }
      return null;
    });
    if (!client) {
      continue;
    }
    const expectedIds = new Set<number>();
    try {
      for await (const ids of getRepositoryPullRequestIDs(client, {
        owner: repo.owner,
        name: repo.name,
      })) {
        for (const {id} of ids) {
          expectedIds.add(id);
        }
      }
    } catch (ex: any) {
      errors.push(
        `Error fetching PRs for ${repo.owner}/${repo.name}: ${ex.message}`,
      );
      continue;
    }

    const unexpectedPullRequests = await tables
      .pull_requests(db)
      .find({
        id: q.not(q.anyOf(expectedIds)),
        git_repository_id: repo.id,
      })
      .select(`id`, `pr_number`, `title`)
      .orderByDesc('pr_number')
      .all();
    pullRequestsToRemove.push(
      ...unexpectedPullRequests.map((pr) => ({
        url: `https://github.com/${repo.owner}/${repo.name}/pull/${pr.pr_number}`,
        title: `${repo.owner}/${repo.name}#${pr.pr_number} - ${pr.title}`,
      })),
    );
  }
  return {
    checkedRepos,
    errors,
    pullRequestsToRemove,
    lastRepo:
      currentOwner && currentRepo ? `${currentOwner}/${currentRepo}` : null,
  };
}
