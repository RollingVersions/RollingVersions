import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertPullRequestFromPayload} from '../../models/PullRequests';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onPullRequestClosed(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);

  const client = getClientForEvent(e);

  await upsertPullRequestFromPayload(
    db,
    client,
    repo,
    e.payload.pull_request,
    logger,
  );
  await updateRepoIfChanged(db, client, repo.id, logger);
}
