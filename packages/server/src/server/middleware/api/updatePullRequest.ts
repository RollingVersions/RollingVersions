import log from '../../logger';
import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';
import {PullRequest} from 'rollingversions/lib/types';
import {User} from '../utils/checkPermissions';
import {GitHubClient} from '../../services/github';
import {UpdatePullRequestBody} from '../../../types';
import writePullRequestState from '../../db-update-jobs/methods/writePullRequestState';
import {db} from '../../services/postgres';

export default async function updatePullRequest(
  client: GitHubClient,
  user: User,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  body: UpdatePullRequestBody,
) {
  log({
    event_status: 'ok',
    event_type: 'submitted_change_set',
    message: `Submitted change set`,
    changes_count: body.updates
      .map((u) =>
        ChangeTypes.map((ct) => u.changes[ct].length).reduce(
          (a, b) => a + b,
          0,
        ),
      )
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
  );
}
