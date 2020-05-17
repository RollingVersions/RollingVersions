import {PullRequest, Repository} from 'rollingversions/lib/types';
import * as gh from 'rollingversions/lib/services/github';
import Permission from './Permission';
import {getClientForToken, getClientForRepo} from '../getClient';
import log from '../logger';
import withCache from '../../utils/withCache';

export {Permission};

/**
 * Check the viewer's permissions on a repository. This only considers
 * permissions from collaborators, so it can return "none" even if
 * the repository is public.
 */
const checkViewerPermissions = withCache(
  async (
    userAuth: string,
    repo: Repository,
  ): Promise<{result: Permission; expiry: number}> => {
    try {
      // We create our own client in this function to prevent it being
      // batched with any other request. This is because getRepositoryViewerPermissions
      // can throw an error even if the repository is public.
      const client = getClientForToken(userAuth);
      const viewerPermission = await gh
        .getRepositoryViewerPermissions(client, repo)
        .catch((ex) => {
          log({
            event_status: 'warn',
            event_type: 'failed_to_get_repository_viewer_permissions',
            message: ex.stack,
          });
          return null;
        });

      // see: https://developer.github.com/v4/enum/repositorypermission/
      if (
        viewerPermission === 'ADMIN' ||
        viewerPermission === 'MAINTAIN' ||
        viewerPermission === 'TRIAGE' ||
        viewerPermission === 'WRITE'
      ) {
        return {result: 'edit', expiry: Date.now() + 60_000};
      }
      if (viewerPermission === 'READ') {
        return {result: 'view', expiry: Date.now() + 60_000};
      }
      return {result: 'none', expiry: Date.now() + 60_000};
    } catch (ex) {
      log({
        event_status: 'warn',
        event_type: 'failed_to_get_repository_viewer_permissions',
        message: ex.stack,
      });
      return {result: 'none', expiry: 5_000};
    }
  },
  (userAuth: string, repo: Repository) =>
    `${userAuth}/${repo.owner}/${repo.name}`,
);

const getViewer = withCache(
  async (userAuth: string) => ({
    result: await gh.getViewer(getClientForToken(userAuth)),
    expiry: Date.now() + 60 * 60_000,
  }),
  (userAuth) => userAuth,
);

export default async function getPermissionLevel(
  pr: Pick<PullRequest, 'repo' | 'number'>,
  userAuth: string,
): Promise<{
  permission: Permission;
  login: string;
  email: string | null;
  reason?: string;
}> {
  const viewerPromise = getViewer(userAuth);
  const [
    {login, email, __typename: viewerTypeName},
    viewerPermission,
    pullRequest,
  ] = await Promise.all([
    viewerPromise,
    checkViewerPermissions(userAuth, pr.repo),
    getClientForRepo(pr.repo)
      .then((repoClient) =>
        Promise.all([
          gh.getRepositoryIsPublic(repoClient, pr.repo),
          gh.getPullRequestAuthor(repoClient, pr),
          gh.getPullRequestStatus(repoClient, pr),
        ] as const),
      )
      .catch(async (ex) => {
        const {login, email} = await viewerPromise;
        log({
          event_status: 'warn',
          event_type: 'failed_to_get_pull_request',
          message: ex.stack,
          login,
          email,
          repo_owner: pr.repo.owner,
          repo_name: pr.repo.name,
          pull_number: pr.number,
        });
        return null;
      }),
  ] as const);

  if (!pullRequest) {
    return {permission: 'none', login, email};
  }

  const [isPublic, author, status] = pullRequest;

  const viewerIsAuthor =
    login === author?.login && viewerTypeName === author.__typename;
  const isPrOpen = !(status?.closed || status?.merged);

  if (viewerPermission === 'edit') {
    return {permission: 'edit', login, email};
  }

  if (isPublic || viewerPermission === 'view') {
    if (viewerIsAuthor && isPrOpen) {
      return {permission: 'edit', login, email};
    }
    return {permission: 'view', login, email};
  }

  return {permission: 'none', login, email};
}

export async function getRepoPermissionLevel(
  repo: Repository,
  userAuth: string,
): Promise<{
  permission: Permission;
  login: string;
  email: string | null;
  reason?: string;
}> {
  const viewerPromise = gh.getViewer(getClientForToken(userAuth));
  const [{login, email}, viewerPermission, isPublic] = await Promise.all([
    viewerPromise,
    checkViewerPermissions(userAuth, repo),
    getClientForRepo(repo)
      .then((repoClient) => gh.getRepositoryIsPublic(repoClient, repo))
      .catch(async (ex) => {
        const {login, email} = await viewerPromise;
        log({
          event_status: 'warn',
          event_type: 'failed_to_get_repo',
          message: ex.stack,
          login,
          email,
          repo_owner: repo.owner,
          repo_name: repo.name,
        });
        return false;
      }),
  ] as const);

  if (viewerPermission === 'edit') {
    return {permission: 'edit', login, email};
  }

  if (isPublic || viewerPermission === 'view') {
    return {permission: 'view', login, email};
  }

  return {permission: 'none', login, email};
}
