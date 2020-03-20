import {Octokit} from 'probot';
import Permission from './Permission';
import {PullRequest} from '@changelogversion/utils/lib/types';

export {Permission};
export default async function getPermissionLevel(
  pr: Pick<PullRequest, 'repo' | 'number'>,
  userAuth: string,
): Promise<Permission> {
  const octokit = new Octokit({auth: userAuth});

  const authenticated = await octokit.users.getAuthenticated();
  let pull;
  try {
    pull = await octokit.pulls.get({
      owner: pr.repo.owner,
      repo: pr.repo.name,
      pull_number: pr.number,
    });
  } catch (ex) {
    return Permission.None;
  }
  if (pull.data.merged) {
    return Permission.View;
  }
  if (pull.data.user.login === authenticated.data.login) {
    return Permission.Edit;
  }
  const permission = await octokit.repos.getCollaboratorPermissionLevel({
    owner: pr.repo.owner,
    repo: pr.repo.name,
    username: authenticated.data.login,
  });
  if (
    permission.data.permission === 'admin' ||
    permission.data.permission === 'write'
  ) {
    return Permission.Edit;
  }
  return Permission.View;
}
