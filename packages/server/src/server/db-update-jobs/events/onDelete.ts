import WebhooksApi from '@octokit/webhooks';
import {db, deleteBranch, deleteTag} from '../../services/postgres';

export default async function onDelete(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadDelete>,
) {
  const gitRepositoryId = e.payload.repository.id;

  if (e.payload.ref_type === 'branch') {
    await deleteBranch(db, gitRepositoryId, e.payload.ref);
  } else {
    await deleteTag(db, gitRepositoryId, e.payload.ref);
  }
}
