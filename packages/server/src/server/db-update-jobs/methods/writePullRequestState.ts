import retry from 'then-retry';
import {
  Queryable,
  updatePullRequestCommentID,
  updateChangeLogEntries,
} from '../../services/postgres';
import {GitHubClient} from '../../services/github';
import {PullRequest, ChangeSet} from 'rollingversions/lib/types';
import readPullRequestState from './readPullRequestState';
import {PullRequestPackage} from '../../../types';

import {
  renderComment,
  getShortDescription,
  getUrlForChangeLog,
} from '../../../utils/Rendering';
import {APP_URL} from '../../environment';
import {updateStatus} from 'rollingversions/lib/services/github';
import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';
import {Logger} from '../../logger';

export default async function writePullRequestState(
  db: Queryable,
  client: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  headSha: string | null,
  changes: {packageName: string; changes: ChangeSet}[],
  logger: Logger,
) {
  const changesByPackage = new Map(
    changes.map((c) => [c.packageName, c.changes]),
  );
  const pr = await readPullRequestState(db, client, pullRequest, logger);
  const packages = new Map(
    [...pr.packages].map(([packageName, metadata]): [
      string,
      PullRequestPackage,
    ] => [
      packageName,
      metadata.released
        ? metadata
        : {
            ...metadata,
            changeSet: changesByPackage.get(packageName) || metadata.changeSet,
          },
    ]),
  );

  const commentBody = renderComment(
    {...pullRequest, headSha: pr.headSha || headSha},
    headSha,
    packages,
    APP_URL,
  );
  if (pr.commentID) {
    const commentID = pr.commentID;
    await retry(() =>
      client.rest.issues.updateComment({
        owner: pullRequest.repo.owner,
        repo: pullRequest.repo.name,
        body: commentBody,
        comment_id: commentID,
      }),
    );
  } else {
    const commentID = (
      await client.rest.issues.createComment({
        owner: pullRequest.repo.owner,
        repo: pullRequest.repo.name,
        issue_number: pullRequest.number,
        body: commentBody,
      })
    ).data.id;
    await updatePullRequestCommentID(db, pr.repo.id, {
      id: pr.id,
      comment_id: commentID,
    });
  }
  if (pr.headSha) {
    await updateStatus(
      client,
      {...pullRequest, headSha: pr.headSha},
      {
        state: pr.headSha === headSha ? 'success' : 'pending',
        url: getUrlForChangeLog(pullRequest, APP_URL),
        description: getShortDescription(
          {...pullRequest, headSha: pr.headSha},
          headSha,
          packages,
        ),
      },
    );
  }
  await updateChangeLogEntries(
    db,
    pr.repo.id,
    pr.id,
    headSha,
    [...packages]
      .flatMap(([package_name, {changeSet}]) =>
        ChangeTypes.flatMap((kind) =>
          changeSet[kind].map((changeLogEntry) => ({
            package_name,
            kind,
            title: changeLogEntry.title,
            body: changeLogEntry.body,
          })),
        ),
      )
      .map((cle, sort_order_weight) => ({...cle, sort_order_weight})),
  );
}
