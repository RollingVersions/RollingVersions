import type WebhooksApi from '@octokit/webhooks';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {db} from '../../services/postgres';
import addRepository from '../procedures/addRepository';

export default async function onInstallation(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallation>,
  logger: Logger,
) {
  const client = getClientForEvent(e);
  for (const repository of e.payload.repositories) {
    const [owner, name] = repository.full_name.split('/');
    await addRepository(
      db,
      client,
      {owner, name},
      {refreshTags: true, refreshPRs: true},
      logger,
    );
  }
}
