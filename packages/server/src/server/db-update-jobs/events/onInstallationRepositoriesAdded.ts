import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import addRepository from '../procedures/addRepository';

export default async function onInstallationRepositoriesAdded(
  e: WebhooksApi.WebhookEvent<
    WebhooksApi.WebhookPayloadInstallationRepositories
  >,
) {
  const client = getClientForEvent(e);
  for (const repository of e.payload.repositories_added) {
    const [owner, name] = repository.full_name.split('/');
    await addRepository(db, client, {owner, name});
  }
}
