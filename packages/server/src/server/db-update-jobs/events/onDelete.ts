import WebhooksApi from '@octokit/webhooks';
import {
  deleteGitReference,
  resolveReferenceFromEventPayload,
} from '../../models/GitReference';
import ServerContext from '../../ServerContext';

export default async function onDelete(
  ctx: ServerContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadDelete>,
) {
  const gitRepositoryId = e.payload.repository.id;

  const ref = resolveReferenceFromEventPayload(e.payload);
  if (!ref) {
    // no point retrying, so we log the error and move on
    ctx.error('invalid_ref_type', `Invalid ref type "${e.payload.ref_type}"`, {
      ref: e.payload.ref,
      ref_type: e.payload.ref,
    });
    return;
  }

  await deleteGitReference(ctx, gitRepositoryId, ref);
}
