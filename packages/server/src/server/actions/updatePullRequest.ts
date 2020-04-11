import {
  GitHubClient,
  writeComment,
  updateStatus,
} from 'rollingversions/lib/services/github';
import {PullRequest} from 'rollingversions/lib/types';
import {APP_URL} from '../environment';
import getPullRequestState from '../getPullRequestState';
import {
  renderComment,
  getUrlForChangeLog,
  getShortDescription,
} from 'rollingversions/lib/utils/Rendering';

export default async function updatePullRequest(
  github: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> &
    Partial<Pick<PullRequest, 'headSha'>>,
) {
  const {state, commentID, closed, updateRequired} = await getPullRequestState(
    github,
    pullRequest,
  );

  if (closed || !updateRequired || !state) return;

  await writeComment(
    github,
    pullRequest,
    renderComment(pullRequest, state, APP_URL),
    commentID || undefined,
  );

  await updateStatus(
    github,
    {...pullRequest, headSha: state.packageInfoFetchedAt},
    {
      state:
        state.packageInfoFetchedAt === state.submittedAtCommitSha
          ? 'success'
          : 'pending',
      url: getUrlForChangeLog(pullRequest, APP_URL),
      description: getShortDescription(state),
    },
  );
}
