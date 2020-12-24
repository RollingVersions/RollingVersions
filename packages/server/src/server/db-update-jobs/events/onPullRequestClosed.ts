import WebhooksApi from '@octokit/webhooks';
import {NonTransactionContext} from '../../ServerContext';
import {upsertRepositoryFromEvent} from '../../models/Repository';
import {upsertPullRequestByGraphID} from '../../models/PullRequests';

export default async function onPullRequestClosed(
  ctx: NonTransactionContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const repo = await upsertRepositoryFromEvent(ctx, e.payload.repository);
  await upsertPullRequestByGraphID(ctx, repo, e.payload.pull_request.node_id, {
    forceUpdate: true,
  });
}
