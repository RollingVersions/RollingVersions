import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import addRepository from '../procedures/addRepository';
import {Logger} from '../../logger';

export default async function onPush(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPush>,
  logger: Logger,
) {
  const client = getClientForEvent(e);
  const repo = e.payload.repository;
  await addRepository(
    db,
    client,
    {owner: repo.owner.login, name: repo.name},
    {refreshTags: true, refreshPRs: false, refreshPrAssociations: true},
    logger,
  );
}
