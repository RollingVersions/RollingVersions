import {
  GitHubClient,
  getPullRequestHeadSha,
  readComment,
  writeComment,
  updateStatus,
} from '@rollingversions/utils/lib/GitHub';
import {PullRequest} from '@rollingversions/utils/lib/types';
import {renderInitialComment} from '@rollingversions/utils/lib/Rendering';
import {APP_URL} from '../environment';

export default async function preparePullRequest(
  github: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> &
    Partial<Pick<PullRequest, 'headSha'>>,
) {
  const queryResults = await Promise.all([
    pullRequest.headSha
      ? pullRequest.headSha
      : getPullRequestHeadSha(github, pullRequest),
    readComment(github, pullRequest),
  ] as const);
  let [, {existingComment}] = queryResults;
  const [headSha, {state}] = queryResults;

  if (!headSha) {
    throw new Error(
      `Could not find head sha for ${pullRequest.repo.owner}/${pullRequest.repo.name}/${pullRequest.number}`,
    );
  }

  if (!existingComment) {
    // If there is no status, we write an initial status as quickly as possible
    // without waiting until we've extracted all the package versions.
    // This improves percieved responsiveness and reduces the chance of use accidentally writing
    // two comments instead of one.
    existingComment = await writeComment(
      github,
      pullRequest,
      renderInitialComment(pullRequest, APP_URL),
      undefined,
    );
    await updateStatus(github, {...pullRequest, headSha}, undefined, APP_URL);
  }
  return {existingComment, headSha, state};
}
