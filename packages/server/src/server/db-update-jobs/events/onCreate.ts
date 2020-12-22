import WebhooksApi from '@octokit/webhooks';
import ServerContext from '../../ServerContext';
import {upsertRepositoryFromEvent} from '../../models/Repository';
import {
  resolveReferenceFromEventPayload,
  updateGitReference,
} from '../../models/GitReference';

export default async function onCreate(
  ctx: ServerContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadCreate>,
) {
  const repo = await upsertRepositoryFromEvent(ctx, e.payload.repository);

  const ref = resolveReferenceFromEventPayload(e.payload);
  if (!ref) {
    // no point retrying, so we log the error and move on
    ctx.error('invalid_ref_type', `Invalid ref type "${e.payload.ref_type}"`, {
      ref: e.payload.ref,
      ref_type: e.payload.ref,
    });
    return;
  }

  await updateGitReference(ctx, repo, ref);
}
