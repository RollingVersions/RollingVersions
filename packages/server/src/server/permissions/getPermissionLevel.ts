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

const getRepositoryIsPublic = withCache(
  async (repo: Repository) => {
    try {
      const client = await getClientForRepo(repo);
      return {
        result: await gh.getRepositoryIsPublic(client, repo),
        expiry: Date.now() + 60_000,
      };
    } catch (ex) {
      log({
        event_status: 'warn',
        event_type: 'failed_to_get_repo',
        message: ex.stack,
        repo_owner: repo.owner,
        repo_name: repo.name,
      });
      return {
        result: false,
        expiry: 0,
      };
    }
  },
  (repo) => `${repo.owner}/${repo.name}`,
);

const getPullRequestAuthor = withCache(
  async (pr: Pick<PullRequest, 'repo' | 'number'>) => {
    try {
      const client = await getClientForRepo(pr.repo);
      const author = await gh.getPullRequestAuthor(client, pr);

      return {
        result: author,
        expiry: author ? Date.now() + 60 * 60_000 : 0,
      };
    } catch (ex) {
      log({
        event_status: 'warn',
        event_type: 'failed_to_get_pr',
        message: ex.stack,
        repo_owner: pr.repo.owner,
        repo_name: pr.repo.name,
      });
      return {
        result: null,
        expiry: 0,
      };
    }
  },
  (pr) => `${pr.repo.owner}/${pr.repo.name}/${pr.number}`,
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
    isPublic,
    author,
    pullRequestStatus,
  ] = await Promise.all([
    viewerPromise,
    checkViewerPermissions(userAuth, pr.repo),
    getRepositoryIsPublic(pr.repo),
    getPullRequestAuthor(pr),
    getClientForRepo(pr.repo)
      .then((repoClient) => gh.getPullRequestStatus(repoClient, pr))
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

  if (!pullRequestStatus) {
    return {permission: 'none', login, email};
  }

  const viewerIsAuthor =
    login === author?.login && viewerTypeName === author.__typename;
  const isPrOpen = !(pullRequestStatus.closed || pullRequestStatus.merged);

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
  const [{login, email}, viewerPermission, isPublic] = await Promise.all([
    getViewer(userAuth),
    checkViewerPermissions(userAuth, repo),
    getRepositoryIsPublic(repo),
  ] as const);

  if (viewerPermission === 'edit') {
    return {permission: 'edit', login, email};
  }

  if (isPublic || viewerPermission === 'view') {
    return {permission: 'view', login, email};
  }

  return {permission: 'none', login, email};
}
