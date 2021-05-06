import GitHubClient, {auth} from '@github-graph/api';
import {withRetry} from 'then-retry';

import {Repository} from '@rollingversions/types';

import * as gh from './github-graph';

export {GitHubClient, auth};

export const getViewer = withRetry(async (client: GitHubClient) => {
  return (await gh.getViewer(client)).viewer;
});

export const getRepositoryViewerPermissions = withRetry(
  async (client: GitHubClient, repo: Repository) => {
    return (
      (await gh.getRepositoryViewerPermissions(client, repo)).repository
        ?.viewerPermission || null
    );
  },
  {
    shouldRetry: (_e, failedAttempts) => failedAttempts < 3,
    retryDelay: () => 100,
  },
);
