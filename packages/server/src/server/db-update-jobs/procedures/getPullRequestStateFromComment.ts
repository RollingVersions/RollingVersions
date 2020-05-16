import {PullRequestState, Repository} from 'rollingversions/lib/types';
import {
  GitHubClient,
  readComments,
  writeComment,
  updateStatus,
  deleteComment,
} from 'rollingversions/lib/services/github';
import {readState} from 'rollingversions/lib/utils/CommentState';
import {
  COMMENT_GUID,
  renderInitialComment,
  getUrlForChangeLog,
} from '../../../utils/Rendering';
import {APP_URL} from '../../environment';
import log from '../../logger';
import {PullRequestDetail} from '../../services/github';

async function getCommentState(
  client: GitHubClient,
  pullRequest: PullRequestDetail & {repo: Repository},
) {
  for await (const comment of readComments(client, pullRequest)) {
    if (comment.body.includes(COMMENT_GUID)) {
      const state = readState(comment.body) || null;
      return {state, commentID: comment.commentID};
    }
  }
  if (!pullRequest.is_closed && pullRequest.head_sha) {
    // If there is no status, we write an initial status as quickly as possible
    // without waiting until we've extracted all the package versions.

    // This improves percieved responsiveness and reduces the chance of use accidentally writing
    // two comments instead of one.

    // Just in case, we then check immediately for duplicates and remove them.
    const commentID = await writeComment(
      client,
      pullRequest,
      renderInitialComment(pullRequest, APP_URL),
      undefined,
    );
    await updateStatus(
      client,
      {...pullRequest, headSha: pullRequest.head_sha},
      {
        state: 'pending',
        url: getUrlForChangeLog(pullRequest, APP_URL),
        description: 'please add a changelog',
      },
    );

    let seenFirstComment = false;
    for await (const comment of readComments(client, pullRequest, {
      pageSize: 50,
    })) {
      if (comment.body.includes(COMMENT_GUID)) {
        if (!seenFirstComment) {
          seenFirstComment = true;
        } else {
          // we have a duplicate comment
          log({
            event_status: 'warn',
            event_type: 'deleting_duplicate_comment',
            message: `Deleting duplicate comment`,
            repo_owner: pullRequest.repo.owner,
            repo_name: pullRequest.repo.name,
            pull_number: pullRequest.number,
          });
          deleteComment(client, pullRequest, comment.commentID).then(
            () => {
              log({
                event_status: 'warn',
                event_type: 'deleted_duplicate_comment',
                message: `Deleted duplicate comment`,
                repo_owner: pullRequest.repo.owner,
                repo_name: pullRequest.repo.name,
                pull_number: pullRequest.number,
              });
            },
            (ex) => {
              log({
                event_status: 'error',
                event_type: 'delete_comment_failed',
                message: `Unable to delete comment:\n\n${ex.stack ||
                  ex.message ||
                  ex}`,
                repo_owner: pullRequest.repo.owner,
                repo_name: pullRequest.repo.name,
                pull_number: pullRequest.number,
              });
            },
          );
        }
      }
    }

    return {state: null, commentID};
  }
  return {state: null, commentID: null};
}

export default async function getPullRequestStateFromComment(
  client: GitHubClient,
  pullRequest: PullRequestDetail & {repo: Repository},
): Promise<{
  state: PullRequestState | null;
  commentID: number | null;
  closed: boolean;
  merged: boolean;
  updateRequired: boolean;
}> {
  const {state, commentID} = await getCommentState(client, pullRequest);

  return {
    state,
    commentID,
    closed: pullRequest.is_closed,
    merged: pullRequest.is_merged,
    updateRequired: false,
  };
}
