import WebhooksApi from '@octokit/webhooks';
import {getClientForEvent} from '../getClient';
import updateRepoDebounced from '../actions/updateRepoDebounced';

export default async function onPush(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPush>,
) {
  if ('refs/heads/' + e.payload.repository.default_branch === e.payload.ref) {
    const client = getClientForEvent(e);
    await updateRepoDebounced(client, {
      owner: e.payload.repository.owner.login,
      name: e.payload.repository.name,
    });
  }
}
