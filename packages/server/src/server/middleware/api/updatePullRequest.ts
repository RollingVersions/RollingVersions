import type {PullRequest} from 'rollingversions/lib/types';

import type {UpdatePullRequestBody} from '../../../types';
import writePullRequestState from '../../db-update-jobs/methods/writePullRequestState';
import type {Logger} from '../../logger';
import type {GitHubClient} from '../../services/github';
import {db} from '../../services/postgres';
import type {User} from '../utils/checkPermissions';

export default async function updatePullRequest(
  client: GitHubClient,
  user: User,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  body: UpdatePullRequestBody,
  logger: Logger,
) {
  logger.info('submitted_change_set', `Submitted change set`, {
    changes_count: body.updates
      .map((u) => u.changes.length)
      .reduce((a, b) => a + b, 0),
    repo_owner: pullRequest.repo.owner,
    repo_name: pullRequest.repo.name,
    pull_number: pullRequest.number,
    ...user,
  });

  await writePullRequestState(
    db,
    client,
    pullRequest,
    body.headSha,
    body.updates,
    logger,
  );
}
