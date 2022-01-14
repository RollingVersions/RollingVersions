import db, {q, tables} from '@rollingversions/db';

import {getClientForRepo} from '../../getClient';
import {getRepositoryPullRequestIDs} from '../../services/github';

export default async function fixupForkPullRequests(lastOwner?: string) {
  const start = Date.now();
  const repositories = await tables
    .git_repositories(db)
    .find(lastOwner ? {owner: q.greaterThan(lastOwner)} : {})
    .orderByAsc(`owner`)
    .all();

  const errors: string[] = [];
  const pullRequestsToRemove: {url: string; title: string}[] = [];
  let currentOwner = null;
  for (const repo of repositories) {
    if (currentOwner !== repo.owner) {
      if (Date.now() - start > 10_000) {
        break;
      }
      currentOwner = repo.owner;
    }

    const client = await getClientForRepo({
      owner: repo.owner,
      name: repo.name,
    }).catch((ex: any) => {
      errors.push(
        `Error getting client for ${repo.owner}/${repo.name}: ${ex.message}`,
      );
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
  return {errors, pullRequestsToRemove, currentOwner};
}
