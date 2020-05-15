import WebhooksApi from '@octokit/webhooks';
import {db, deleteBranch, deleteTag} from '../../services/postgres';
import {getGitReference} from './onCreate';

export default async function onDelete(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadDelete>,
) {
  const ref = getGitReference(e.payload);

  const gitRepositoryId = e.payload.repository.id;

  if (ref.type === 'head') {
    await deleteBranch(db, gitRepositoryId, ref.name);
  } else {
    await deleteTag(db, gitRepositoryId, ref.name);
  }
}
