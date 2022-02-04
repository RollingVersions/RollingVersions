import assertNever from 'assert-never';

import db, {tables} from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {refreshPullRequests} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import {InstallationRepositoriesEvent} from '../event-types';

export default async function onInstallationRepositories(
  e: InstallationRepositoriesEvent,
  logger: Logger,
) {
  switch (e.payload.action) {
    case 'added':
      return await onInstallationRepositoriesAdded(e, logger);
    default:
      return assertNever(e.payload.action);
  }
}

async function onInstallationRepositoriesAdded(
  e: InstallationRepositoriesEvent,
  logger: Logger,
) {
  const client = getClientForEvent(e);

  const repos = await Promise.all(
    e.payload.repositories_added
      .filter((repository) => {
        const [owner] = repository.full_name.split('/');
        return owner !== 'sitedata';
      })
      .map(async (repository) => {
        const [owner, name] = repository.full_name.split('/');
        const repo = await getRepositoryFromRestParams(db, client, {
          owner,
          name,
        });
        if (repo) {
          logger.info(
            'added_repository',
            `Added repository: ${owner}/${name}`,
            {
              repo_owner: owner,
              repo_name: name,
            },
          );
        }
        return repo;
      }),
  );

  await Promise.all(
    repos.map(async (repo) => {
      if (repo) {
        await refreshPullRequests(db, client, repo, logger);
        const pullRequests = await tables
          .pull_requests(db)
          .find({git_repository_id: repo.id, is_closed: false})
          .all();
        for (const pullRequest of pullRequests) {
          await updatePullRequestComment(db, client, repo, pullRequest, logger);
        }
      }
    }),
  );

  // Updating statuses on commits requires loading the git history.
  // If this is the first time, that's going to require lots of RAM, so
  // to give us the best possible chance, we only do this with one
  // repository at a time.
  // We also only do it for open pull requests
  for (const repo of repos) {
    if (repo) {
      const pullRequests = await tables
        .pull_requests(db)
        .find({git_repository_id: repo.id, is_closed: false})
        .all();
      for (const pullRequest of pullRequests) {
        await updatePullRequestStatus(db, client, repo, pullRequest, logger);
      }
    }
  }
}
