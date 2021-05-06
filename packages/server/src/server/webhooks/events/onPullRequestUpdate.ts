import type WebhooksApi from '@octokit/webhooks';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated} from '../../models/git';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {upsertPullRequestFromPayload} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';

export default async function onPullRequestUpdate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  logger: Logger,
) {
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);

  const client = getClientForEvent(e);

  const pr = await upsertPullRequestFromPayload(
    db,
    client,
    repo,
    e.payload.pull_request,
    logger,
  );

  await updatePullRequestComment(db, client, repo, pr, logger);
  await updatePullRequestStatus(db, client, repo, pr, logger);
}
