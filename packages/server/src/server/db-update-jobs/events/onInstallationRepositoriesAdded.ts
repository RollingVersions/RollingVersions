import type WebhooksApi from '@octokit/webhooks';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {db} from '../../services/postgres';
import addRepository from '../procedures/addRepository';

export default async function onInstallationRepositoriesAdded(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallationRepositories>,
  logger: Logger,
) {
  const client = getClientForEvent(e);
  for (const repository of e.payload.repositories_added) {
    const [owner, name] = repository.full_name.split('/');
    logger.info('added_repository', `Added repository: ${owner}/${name}`, {
      repo_owner: owner,
      repo_name: name,
    });
    await addRepository(
      db,
      client,
      {owner, name},
      {refreshTags: true, refreshPRs: true},
      logger,
    );
  }
}
