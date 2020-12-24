import WebhooksApi from '@octokit/webhooks';
import ServerContext from '../../ServerContext';
import {upsertRepositoryFromEvent} from '../../models/Repository';

export default async function onInstallation(
  ctx: ServerContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallation>,
) {
  for (const repository of e.payload.repositories) {
    const [repo_owner, repo_name] = repository.full_name.split('/');
    await upsertRepositoryFromEvent(
      ctx.withContext({repo_owner, repo_name}),
      repository,
    );
  }
}
