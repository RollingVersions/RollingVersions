import WebhooksApi from '@octokit/webhooks';
import updateRepo from '../actions/updateRepo';
import {getClientForEvent} from '../getClient';

export default async function onInstallation(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallation>,
) {
  const client = getClientForEvent(e);
  for (const r of e.payload.repositories) {
    const [owner, name] = r.full_name.split('/');
    await updateRepo(client, {owner, name});
  }
}
