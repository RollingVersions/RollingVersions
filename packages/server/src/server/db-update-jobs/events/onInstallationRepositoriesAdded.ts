import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import addRepository from '../procedures/addRepository';
import {Logger} from '../../logger';

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
