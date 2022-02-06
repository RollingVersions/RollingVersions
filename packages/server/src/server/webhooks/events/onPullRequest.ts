import assertNever from 'assert-never';

import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {upsertPullRequestFromPayload} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';
import {PullRequestEvent} from '../event-types';

export default async function onPullRequest(
  e: PullRequestEvent,
  logger: Logger,
) {
  switch (e.payload.action) {
    case 'opened':
    case 'synchronize':
    case 'edited':
    case 'reopened':
      return await onPullRequestUpdate(e, logger);
    case 'closed':
      return await onPullRequestClosed(e, logger);
    case 'auto_merge_enabled':
    case 'auto_merge_disabled':
    case 'review_requested':
    case 'review_request_removed':
    case 'ready_for_review':
    case 'labeled':
    case 'unlabeled':
    case 'assigned':
    case 'unassigned':
      // We don't use pull request labels at the moment
      return;
    default:
      return assertNever(e.payload.action);
  }
}

async function onPullRequestUpdate(e: PullRequestEvent, logger: Logger) {
  if (e.payload.repository.owner.login === 'sitedata') return;
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

async function onPullRequestClosed(e: PullRequestEvent, logger: Logger) {
  if (e.payload.repository.owner.login === 'sitedata') return;
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
