import WebhooksApi from '@octokit/webhooks';
import {NonTransactionContext} from '../../ServerContext';
import {upsertRepositoryFromEvent} from '../../models/Repository';
import {upsertPullRequestByGraphID} from '../../models/PullRequests';

export default async function onPullRequestUpdate(
  ctx: NonTransactionContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const repo = await upsertRepositoryFromEvent(ctx, e.payload.repository);
  const pr = await upsertPullRequestByGraphID(
    ctx,
    repo,
    e.payload.pull_request.node_id,
    {forceUpdate: true},
  );
  if (!pr) {
    ctx.throw(
      `missing_pull_request`,
      `Could not find the pull request for this event.`,
    );
  }
}
