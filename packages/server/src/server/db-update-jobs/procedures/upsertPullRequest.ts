import {
  Connection,
  getPullRequestCommentID,
  insertPullRequest,
  updatePullRequest,
  setPullRequestSubmittedAtSha,
  insertChangeLogEntries,
} from '../../services/postgres';
import {
  GitHubClient,
  getPullRequestFromGraphID,
  getPullRequestFromNumber,
} from '../../services/github';
import getPullRequestStateFromComment from './getPullRequestStateFromComment';
import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';
import {Logger} from '../../logger';
import {deleteComment, readComments} from 'rollingversions/lib/services/github';
import {COMMENT_GUID} from '../../../utils/Rendering';

export default async function upsertPullRequest(
  db: Connection,
  client: GitHubClient,
  repositoryId: number,
  repo: {owner: string; name: string},
  pullRequestId: string | number,
  logger: Logger,
) {
  const pr =
    typeof pullRequestId === 'string'
      ? await getPullRequestFromGraphID(client, pullRequestId)
      : await getPullRequestFromNumber(client, repo, pullRequestId);
  if (!pr) {
    throw new Error(`Unable to load the requested pull request`);
  }
  const existingPr = await getPullRequestCommentID(db, repositoryId, pr.id);
  if (existingPr) {
    const {change_set_submitted_at_git_commit_sha} =
      (await updatePullRequest(db, repositoryId, {
        ...pr,
      })) || {};
    return {
      ...pr,
      submittedAtCommitSha: change_set_submitted_at_git_commit_sha,
      commentID: existingPr.commentID,
    };
  } else {
    // by reading (and writing) state to the actual pull request itself (via a comment)
    // we can ensure that RollingVersions state is persisted even if Rolling Versions is
    // removed from the repository
    const {state, commentID} = await getPullRequestStateFromComment(client, {
      ...pr,
      repo,
    });
    try {
      await db.tx(async (tx) => {
        await insertPullRequest(tx, repositoryId, {
          ...pr,
          comment_id: commentID,
        });
        if (state) {
          await setPullRequestSubmittedAtSha(
            tx,
            repositoryId,
            pr.id,
            state.submittedAtCommitSha,
          );
          await insertChangeLogEntries(
            tx,
            pr.id,
            [...state.packages]
              .flatMap(([package_name, changeSet]) =>
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
      });
    } catch (ex) {
      const dbPr = await getPullRequestCommentID(db, repositoryId, pr.id).catch(
        () => null,
      );
      if (dbPr?.commentID) {
        for await (const comment of readComments(
          client,
          {number: pr.number, repo},
          {
            pageSize: 50,
          },
        )) {
          if (
            comment.commentID !== dbPr.commentID &&
            comment.body.includes(COMMENT_GUID)
          ) {
            // we have a duplicate comment
            logger.warning(
              'deleting_duplicate_comment',
              `Deleting duplicate comment`,
              {
                repo_owner: repo.owner,
                repo_name: repo.name,
                pull_number: pr.number,
                comment_id_to_keep: dbPr.commentID,
                comment_id_to_delete: comment.commentID,
              },
            );
            const timer = logger.withTimer();
            deleteComment(
              client,
              {number: pr.number, repo},
              comment.commentID,
            ).then(
              () => {
                timer.warning(
                  'deleted_duplicate_comment',
                  `Deleted duplicate comment`,
                  {
                    repo_owner: repo.owner,
                    repo_name: repo.name,
                    pull_number: pr.number,
                  },
                );
              },
              (ex) => {
                timer.error(
                  'delete_comment_failed',
                  `Unable to delete comment:\n\n${ex.stack ||
                    ex.message ||
                    ex}`,
                  {
                    repo_owner: repo.owner,
                    repo_name: repo.name,
                    pull_number: pr.number,
                  },
                );
              },
            );
          }
        }
      }
      throw ex;
    }
    return {
      ...pr,
      submittedAtCommitSha: state?.submittedAtCommitSha,
      commentID,
    };
  }
}
