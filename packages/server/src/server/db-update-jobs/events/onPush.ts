import type WebhooksApi from '@octokit/webhooks';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {db} from '../../services/postgres';
import addRepository from '../procedures/addRepository';

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
