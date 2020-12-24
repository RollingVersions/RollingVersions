import {PullRequest} from 'rollingversions/lib/types';
import {upsertRepositoryFromName} from '../../models/Repository';
import {NonTransactionContext} from '../../ServerContext';
import {upsertPullRequestByNumber} from '../../models/PullRequests';
import getPullRequestPackages from './getPullRequestPackages';

export default async function readPullRequestState(
  ctx: NonTransactionContext,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
) {
  const repo = await upsertRepositoryFromName(ctx, pullRequest.repo);
  if (!repo) return null;

  const pr = await upsertPullRequestByNumber(ctx, repo, pullRequest.number);
  if (!pr) return null;

  return {
    headSha: pr.headCommit?.commit_sha || null,
    is_closed: pr.is_closed,
    is_merged: pr.is_merged,
    packages: await getPullRequestPackages(ctx, repo, pr),
  };
}
