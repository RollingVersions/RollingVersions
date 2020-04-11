import {APP_URL} from '../environment';
import {
  GitHubClient,
  writeComment,
  updateStatus,
} from 'rollingversions/lib/services/github';
import {PullRequest, ChangeSet} from 'rollingversions/lib/types';
import {
  renderComment,
  getShortDescription,
  getUrlForChangeLog,
} from 'rollingversions/lib/utils/Rendering';
import getPullRequestState from '../getPullRequestState';

export default async function updatePullRequestWithState(
  github: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> &
    Partial<Pick<PullRequest, 'headSha'>>,
  headSha: string,
  updates: {packageName: string; changes: ChangeSet}[],
) {
  const {state, commentID} = await getPullRequestState(github, pullRequest);

  if (!state || !commentID) {
    throw new Error(
      `Could not load state for the pull request: ${pullRequest.repo.owner}/${pullRequest.repo.name}#${pullRequest.number}`,
    );
  }

  const newPackages = new Map([...state.packages]);
  for (const {packageName, changes} of updates) {
    newPackages.set(packageName, {
      changes,
      info: state.packages.get(packageName)?.info || [],
    });
  }

  const newState = {
    ...state,
    submittedAtCommitSha: headSha,
    packages: newPackages,
  };

  //   readonly packages: Map<string, {
  //     changes: ChangeSet;
  //     info: PackageInfo[];
  // }>;
  await writeComment(
    github,
    pullRequest,
    renderComment(pullRequest, newState, APP_URL),
    commentID,
  );

  await updateStatus(
    github,
    {...pullRequest, headSha: state.packageInfoFetchedAt},
    {
      state:
        state.packageInfoFetchedAt === newState.submittedAtCommitSha
          ? 'success'
          : 'pending',
      url: getUrlForChangeLog(pullRequest, APP_URL),
      description: getShortDescription(newState),
    },
  );
}
