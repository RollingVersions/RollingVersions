import WebhooksApi from '@octokit/webhooks';
import {getClientForEvent} from '../getClient';
import updatePullRequest from '../actions/updatePullRequest';

export default async function onPullRequestUpdate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const client = getClientForEvent(e);
  await updatePullRequest(client, {
    repo: {
      owner: e.payload.repository.owner.login,
      name: e.payload.repository.name,
    },
    number: e.payload.pull_request.number,
    headSha: e.payload.pull_request.head.sha,
  });
}
