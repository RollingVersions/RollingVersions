import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import addRepository from '../procedures/addRepository';

export default async function onPush(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPush>,
) {
  const client = getClientForEvent(e);
  const repo = e.payload.repository;
  await addRepository(
    db,
    client,
    {owner: repo.owner.login, name: repo.name},
    {refreshTags: true, refreshPRs: false},
  );
}
