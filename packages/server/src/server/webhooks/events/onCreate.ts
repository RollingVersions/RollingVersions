import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onCreate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadCreate>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);
  const client = getClientForEvent(e);
  void updateRepoIfChanged(db, client, repo.id, logger).catch((ex) => {
    logger.error(`update_repo_failed`, ex.stack);
  });
}
