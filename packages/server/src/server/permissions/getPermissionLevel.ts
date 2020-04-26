import {PullRequest} from 'rollingversions/lib/types';
import Permission from './Permission';
import {getClientForToken, getClientForRepo} from '../getClient';
import log from '../logger';

// TODO: this should use GraphQL rather than the REST API

export {Permission};
export default async function getPermissionLevel(
  pr: Pick<PullRequest, 'repo' | 'number'>,
  userAuth: string,
): Promise<{
  permission: Permission;
  login: string;
  email: string | null;
  reason?: string;
}> {
  const client = getClientForToken(userAuth);

  const [
    repoClient,
    {
      data: {login, email},
    },
  ] = await Promise.all([
    getClientForRepo(pr.repo).catch((ex) => {
      log({
        event_status: 'warn',
        event_type: 'failed_to_get_client_for_pr',
        message: ex.stack,
      });
      return null;
    }),
    client.rest.users.getAuthenticated().catch((ex) => {
      log({
        event_status: 'error',
        event_type: 'failed_to_authenticate_user',
        message: ex.stack,
      });
      return {data: {login: 'unknown', email: null}};
    }),
  ] as const);

  if (!repoClient) {
    return {permission: 'none', login, email, reason: 'no_repo_client'};
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
    return {permission: 'none', login, email, reason: 'no_pull_request_found'};
  }

  if (permission === 'admin' || permission === 'write') {
    return {permission: 'edit', login, email};
  }

  if (pull.data.merged) {
    return {
      permission: 'view',
      login,
      email,
    };
  }

  if (pull.data.user.login === login) {
    return {permission: 'edit', login, email};
  }

  return {permission: 'view', login, email};
}
