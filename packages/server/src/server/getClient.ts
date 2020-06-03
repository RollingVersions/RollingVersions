import {GitHubClient, auth, GitHubOptions} from './services/github';
import {Repository} from 'rollingversions/lib/types';
import {APP_ID, PRIVATE_KEY} from './environment';
import isObject from '../utils/isObject';
import withCache from '../utils/withCache';
import log from './logger';

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
    number
  >();
  return {
    ...options,
    rateLimitOptions: {
      maxSize: 300,
      interval: 2000,
    },
    onBatchRequest(req) {
      starts.set(req, Date.now());
    },
    onBatchResponse(req, res) {
      const duration = Date.now() - (starts.get(req) || 0);
      if (res.data?.errors?.length) {
        log({
          event_status: 'error',
          event_type: 'graphql_batch_error',
          message: `GraphQL Batch Error: ${res.data.errors[0]?.message}`,
          query: req.query,
          variables: req.variables,
          errors: res.data.errors,
          duration,
        });
      } else {
        log({
          event_status: 'ok',
          event_type: 'graphql_batch_response',
          message: `GraphQL Batch Response`,
          query: req.query,
          variables: req.variables,
          errors: res.data.errors,
          duration,
        });
      }
    },
    onResponse({query, variables}, {errors}) {
      if (errors?.length) {
        log({
          event_status: 'error',
          event_type: 'graphql_error',
          message: `GraphQL Error: ${errors[0].message}`,
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
