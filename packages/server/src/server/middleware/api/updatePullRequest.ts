import db, {q, tables} from '@rollingversions/db';
import {ChangeLogEntries_InsertParameters} from '@rollingversions/db/change_log_entries';
import {PullRequest} from '@rollingversions/types';

import type {UpdatePullRequestBody} from '../../../types';
import type {Logger} from '../../logger';
import {updatePullRequestComment} from '../../models/PullRequestComment';
import {getPullRequestFromRestParams} from '../../models/PullRequests';
import {updatePullRequestStatus} from '../../models/PullRequestStatus';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';
import type {User} from '../utils/checkPermissions';

export default async function updatePullRequest(
  client: GitHubClient,
  user: User,
  pr: PullRequest,
  body: UpdatePullRequestBody,
  logger: Logger,
) {
  logger.info('submitted_change_set', `Submitted change set`, {
    changes_count: body.updates
      .map((u) => u.changes.length)
      .reduce((a, b) => a + b, 0),
    repo_owner: pr.repo.owner,
    repo_name: pr.repo.name,
    pull_number: pr.number,
    ...user,
  });

  const repo = await getRepositoryFromRestParams(db, client, {
    owner: pr.repo.owner,
    name: pr.repo.name,
  });
  if (!repo) return false;

  const pullRequest = await getPullRequestFromRestParams(
    db,
    client,
    repo,
    pr.number,
    logger,
  );
  if (!pullRequest) return false;

  const updatedPullRequest = await db.tx(async (db) => {
    await tables.change_log_entries(db).delete({
      pull_request_id: pullRequest.id,
      package_name: q.anyOf(body.updates.map((u) => u.packageName)),
    });
    await tables.change_log_entries(db).insert(
      ...body.updates
        .flatMap(({packageName, changes}) =>
          changes.map(
            (
              change,
            ): Omit<
              ChangeLogEntries_InsertParameters,
              'sort_order_weight'
            > => ({
              kind: change.type,
              title: change.title,
              body: change.body,
              package_name: packageName,
              pull_request_id: pullRequest.id,
            }),
          ),
        )
        .map((change, sort_order_weight) => ({...change, sort_order_weight})),
    );
    const [updatedPullRequest] = await tables.pull_requests(db).update(
      {id: pullRequest.id},
      {
        change_set_submitted_at_git_commit_sha:
          body.headSha ?? `unknown_commit`,
        comment_updated_at_commit_sha: null,
        status_updated_at_commit_sha: null,
      },
    );
    return updatedPullRequest;
  });

  await Promise.all([
    updatePullRequestComment(db, client, repo, updatedPullRequest, logger),
    updatePullRequestStatus(db, client, repo, updatedPullRequest, logger),
  ]);
  return true;
}
