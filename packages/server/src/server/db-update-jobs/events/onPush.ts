import WebhooksApi from '@octokit/webhooks';
import ServerContext from '../../ServerContext';
import {upsertRepositoryFromEvent} from '../../models/Repository';
import {
  resolveReferenceFromString,
  updateGitReference,
} from '../../models/GitReference';

export default async function onPush(
  ctx: ServerContext,
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPush>,
) {
  const repo = await upsertRepositoryFromEvent(ctx, e.payload.repository);
  const ref = resolveReferenceFromString(e.payload.ref);
  if (!ref) {
    // no point retrying, so we log the error and move on
    ctx.error('invalid_ref_type', `Invalid ref type "${e.payload.ref}"`, {
      ref: e.payload.ref,
      ref_type: e.payload.ref,
    });
    return;
  }

  await updateGitReference(ctx, repo, ref);
}
