import {GitHubClient, readComments} from '../services/github';
import {PullRequest} from '../types/GitHub';
import {readState} from './CommentState';

// N.B. this comment guid must be kept in sync with the backend for now
export const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;

export default async function getStateFromPullRequestComment(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
) {
  for await (const comment of readComments(client, pr)) {
    if (comment.body.includes(COMMENT_GUID)) {
      try {
        const st = readState(comment.body);
        return st ? {...st, pr: pr.number} : undefined;
      } catch (ex) {
        console.warn(`Unable to read state for pull request: ${pr.number}`);
        return undefined;
      }
    }
  }
  return undefined;
}
