import {
  readComments,
  writeComment,
  updateStatus,
} from 'rollingversions/lib/services/github';
import type {PullRequestState, Repository} from 'rollingversions/lib/types';
import {readState} from 'rollingversions/lib/utils/CommentState';

import {
  COMMENT_GUID,
  renderInitialComment,
  getUrlForChangeLog,
} from '../../../utils/Rendering';
import {APP_URL} from '../../environment';
import type {GitHubClient, PullRequestDetail} from '../../services/github';

async function getCommentState(
  client: GitHubClient,
  pullRequest: PullRequestDetail & {repo: Repository},
) {
  for await (const comment of readComments(client, pullRequest)) {
    if (comment.body.includes(COMMENT_GUID)) {
      try {
        const state = readState(comment.body) || null;
        return {state, commentID: comment.commentID};
      } catch (ex) {
        // TODO: could we avoid swallowing these errors?
        return {state: null, commentID: comment.commentID};
      }
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
