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

export default async function updatePullRequestWithState(
  github: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> &
    Partial<Pick<PullRequest, 'headSha'>>,
  state: Omit<PullChangeLog, 'packageInfoCache'>,
) {
  const {existingComment, headSha, state: oldState} = await preparePullRequest(
    github,
    pullRequest,
  );

  const currentVersions =
    oldState.packageInfoCache && oldState.packageInfoCache.headSha === headSha
      ? oldState.packageInfoCache.packages
      : await listPackages(github, pullRequest);

  const pr = {
    ...pullRequest,
    headSha,
    currentVersions,
  };

  const st = {...state, packageInfoCache: oldState.packageInfoCache};

  await writeComment(
    github,
    pr,
    renderComment(pr, st, APP_URL),
    existingComment,
  );

  await updateStatus(github, pr, st, APP_URL);
}
