import {
  GitHubClient,
  writeComment,
  updateStatus,
  listPackages,
} from '@rollingversions/utils/lib/GitHub';
import {PullRequest} from '@rollingversions/utils/lib/types';
import {renderComment} from '@rollingversions/utils/lib/Rendering';
import PullChangeLog from '@rollingversions/utils/lib/PullChangeLog';
import {APP_URL} from '../environment';
import preparePullRequest from './preparePullRequest';

export default async function updatePullRequest(
  github: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> &
    Partial<Pick<PullRequest, 'headSha'>>,
) {
  const {existingComment, state: oldState, headSha} = await preparePullRequest(
    github,
    pullRequest,
  );

  const currentVersions =
    oldState.packageInfoCache &&
    oldState.packageInfoCache.headSha === pullRequest.headSha
      ? oldState.packageInfoCache.packages
      : await listPackages(github, pullRequest);

  const state: PullChangeLog = {
    ...oldState,
    packageInfoCache: {headSha, packages: currentVersions},
  };

  const pr = {...pullRequest, currentVersions, headSha};

  await writeComment(
    github,
    pr,
    renderComment(pr, state, APP_URL),
    existingComment,
  );

  await updateStatus(github, pr, state, APP_URL);
}
