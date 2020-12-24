import WebhooksApi from '@octokit/webhooks';
import ServerContext from '../../ServerContext';
import {upsertRepositoryFromEvent} from '../../models/Repository';

export default async function onInstallationRepositoriesAdded(
  ctx: ServerContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallationRepositories>,
) {
  for (const repository of e.payload.repositories_added) {
    const [repo_owner, repo_name] = repository.full_name.split('/');
    await upsertRepositoryFromEvent(
      ctx.withContext({repo_owner, repo_name}),
      repository,
    );
  }
}
