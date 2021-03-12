import type WebhooksApi from '@octokit/webhooks';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {updatePullRequest, db} from '../../services/postgres';
import addRepository from '../procedures/addRepository';

export default async function onPullRequestClosed(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  logger: Logger,
) {
  const git_repository_id = e.payload.repository.id;
  await updatePullRequest(db, git_repository_id, {
    id: e.payload.pull_request.id,
    title: e.payload.pull_request.title,
    is_closed: true,
    is_merged: e.payload.pull_request.merged,
  });
  const client = getClientForEvent(e);
  await addRepository(
    db,
    client,
    {
      owner: e.payload.repository.owner.login,
      name: e.payload.repository.name,
    },
    {refreshTags: true, refreshPRs: false, refreshPrAssociations: true},
    logger,
  );
}
