import {Octokit} from 'probot';
import Permission from './Permission';

export {Permission};
export default async function getPermissionLevel({
  owner,
  repo,
  pull_number,
  userAuth,
}: {
  owner: string;
  repo: string;
  pull_number: number;
  userAuth: string;
}): Promise<Permission> {
  const octokit = new Octokit({auth: userAuth});

  const authenticated = await octokit.users.getAuthenticated();
  let pull;
  try {
    pull = await octokit.pulls.get({owner, repo, pull_number});
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
    owner,
    repo,
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
