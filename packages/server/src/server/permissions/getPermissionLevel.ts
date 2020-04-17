import {PullRequest} from 'rollingversions/lib/types';
import {GitHubClient} from 'rollingversions/lib/services/github';
import Permission from './Permission';
import {getClientForToken, getClientForRepo} from '../getClient';

// TODO: this should use GraphQL rather than the REST API

export {Permission};
export default async function getPermissionLevel(
  pr: Pick<PullRequest, 'repo' | 'number'>,
  userAuth: string,
): Promise<Permission> {
  const client = getClientForToken(userAuth);

  let repoClient: GitHubClient;
  let login: string;
  try {
    [
      repoClient,
      {
        data: {login},
      },
    ] = await Promise.all([
      getClientForRepo(pr.repo),
      client.rest.users.getAuthenticated(),
    ]);
  } catch (ex) {
    return 'none';
  }

  const [pull, permission] = await Promise.all([
    repoClient.rest.pulls
      .get({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        pull_number: pr.number,
      })
      .catch(() => null),
    repoClient.rest.repos
      .getCollaboratorPermissionLevel({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        username: login,
      })
      .then(
        ({data}) => data.permission,
        () => 'none',
      ),
  ]);

  if (!pull) {
    return 'none';
  }

  if (permission === 'admin' || permission === 'write') {
    return 'edit';
  }

  if (pull.data.merged) {
    return 'view';
  }

  if (pull.data.user.login === login) {
    return 'edit';
  }

  return 'view';
}
