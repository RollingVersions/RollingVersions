import type {Repository} from 'rollingversions/lib/types';

import isObject from '../utils/isObject';
import withCache from '../utils/withCache';
import {APP_ID, PRIVATE_KEY} from './environment';
import type {Logger} from './logger';
import logger from './logger';
import {GitHubClient, auth} from './services/github';
import type {GitHubOptions} from './services/github';

function addLogging(
  options: Omit<
    GitHubOptions,
    'rateLimitOptions' | 'onBatchRequest' | 'onBatchResponse' | 'onResponse'
  >,
): GitHubOptions {
  const starts = new WeakMap<
    {
      query: string;
      variables: any;
    },
    Logger
  >();
  return {
    ...options,
    rateLimitOptions: {
      maxSize: 300,
      interval: 2000,
    },
    onBatchRequest(req) {
      starts.set(req, logger.withTimer());
    },
    onBatchResponse(req, res) {
      const timer = starts.get(req) || logger;
      if (res.data.errors?.length) {
        timer.error(
          'graphql_batch_error',
          `GraphQL Batch Error: ${res.data.errors[0]?.message}`,
          {
            query: req.query,
            variables: req.variables,
            errors: res.data.errors,
          },
        );
      } else {
        timer.info('graphql_batch_response', `GraphQL Batch Response`, {
          query: req.query,
          variables: req.variables,
          errors: res.data.errors,
        });
      }
    },
    onResponse({query, variables}, {errors}) {
      if (errors?.length) {
        logger.error('graphql_error', `GraphQL Error: ${errors[0].message}`, {
          query,
          variables,
          errors,
        });
      }
    },
  };
}
export function getClientForEvent(event: {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
}) {
  if (
    isObject(event.payload) &&
    isObject(event.payload.installation) &&
    typeof event.payload.installation.id === 'number' &&
    (event.name !== 'installation' || event.payload.action !== 'deleted')
  ) {
    return getClient(event.payload.installation.id);
  } else {
    return getClient();
  }
}
export default function getClient(installationId?: number) {
  return new GitHubClient(
    addLogging({
      auth: auth.createAppAuth({
        id: APP_ID,
        privateKey: PRIVATE_KEY,
        installationId,
      }),
    }),
  );
}

export const getClientForRepo = withCache(
  async function getClientForRepo({owner, name}: Repository) {
    const installation = await getClient().rest.apps.getRepoInstallation({
      owner,
      repo: name,
    });
    if (installation.status !== 200) {
      throw new Error(
        `Rolling Versions does not seem to be installed for ${owner}`,
      );
    }
    const installationID = installation.data.id;
    return {
      result: getClient(installationID),
      expiry: Date.now() + 60 * 60_000,
    };
  },
  ({owner, name}) => `${owner}/${name}`,
);

export function getClientForToken(token: string) {
  return new GitHubClient(
    addLogging({
      auth: auth.createTokenAuth(token),
    }),
  );
}
