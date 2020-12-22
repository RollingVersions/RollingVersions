import {PullRequest} from 'rollingversions/lib/types';
import {Permission} from '../utils/checkPermissions';
import {PullRequestResponse} from '../../../types';
import readPullRequestState from '../../db-update-jobs/methods/readPullRequestState';
import {NonTransactionContext} from '../../ServerContext';

export default async function getPullRequest(
  ctx: NonTransactionContext,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  permission: Permission,
): Promise<PullRequestResponse | null> {
  const pr = await readPullRequestState(ctx, pullRequest);
  if (!pr) {
    return null;
  }
  ctx.info('loaded_change_set', `Loaded change set`, {
    packages_count: pr.packages.size,
    closed: pr.is_closed,
    merged: pr.is_merged,
  });

  return {
    permission,
    headSha: pr.headSha,
    packages: pr.packages,
    closed: pr.is_closed,
    merged: pr.is_merged,
  };
}
