import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import addRepository from '../procedures/addRepository';

export default async function onInstallation(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallation>,
) {
  const client = getClientForEvent(e);
  for (const repository of e.payload.repositories) {
    const [owner, name] = repository.full_name.split('/');
    await addRepository(db, client, {owner, name});
  }
}
