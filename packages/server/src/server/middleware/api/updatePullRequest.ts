import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';
import {PullRequest} from 'rollingversions/lib/types';
import {UpdatePullRequestBody} from '../../../types';
import writePullRequestState from '../../db-update-jobs/methods/writePullRequestState';
import {NonTransactionContext} from '../../ServerContext';

export default async function updatePullRequest(
  ctx: NonTransactionContext,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  body: UpdatePullRequestBody,
) {
  ctx.info('submitted_change_set', `Submitted change set`, {
    changes_count: body.updates
      .map((u) =>
        ChangeTypes.map((ct) => u.changes[ct].length).reduce(
          (a, b) => a + b,
          0,
        ),
      )
      .reduce((a, b) => a + b, 0),
  });

  return await writePullRequestState(
    ctx,
    pullRequest,
    body.headSha,
    body.updates,
  );
}
