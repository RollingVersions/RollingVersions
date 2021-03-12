import type {PullRequest} from 'rollingversions/lib/types';

import type {PullRequestResponse} from '../../../types';
import readPullRequestState from '../../db-update-jobs/methods/readPullRequestState';
import type {Logger} from '../../logger';
import type {GitHubClient} from '../../services/github';
import {db} from '../../services/postgres';
import type {Permission, User} from '../utils/checkPermissions';

export default async function getPullRequest(
  client: GitHubClient,
  user: User,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  permission: Permission,
  logger: Logger,
): Promise<PullRequestResponse> {
  const pr = await db.task((db) =>
    readPullRequestState(db, client, pullRequest, logger),
  );

  logger.info('loaded_change_set', `Loaded change set`, {
    packages_count: pr.packages.size,
    closed: pr.is_closed,
    merged: pr.is_merged,
    repo_owner: pullRequest.repo.owner,
    repo_name: pullRequest.repo.name,
    pull_number: pullRequest.number,
    ...user,
  });

  return {
    permission,
    headSha: pr.headSha,
    packages: pr.packages,
    closed: pr.is_closed,
    merged: pr.is_merged,
  };
}
