import type {WebhookEvent} from '@octokit/webhooks';
import WebhooksApi from '@octokit/webhooks';

import onCreate from '../db-update-jobs/events/onCreate';
import onDelete from '../db-update-jobs/events/onDelete';
import onInstallation from '../db-update-jobs/events/onInstallation';
import onInstallationRepositoriesAdded from '../db-update-jobs/events/onInstallationRepositoriesAdded';
import onPullRequestClosed from '../db-update-jobs/events/onPullRequestClosed';
import onPullRequestUpdate from '../db-update-jobs/events/onPullRequestUpdate';
import onPush from '../db-update-jobs/events/onPush';
import {WEBHOOK_SECRET} from '../environment';
import logger from '../logger';
import type {Logger} from '../logger';

const webhooks = new WebhooksApi({secret: WEBHOOK_SECRET});

async function withLog(
  event: WebhookEvent<unknown>,
  {message, ...otherParams}: {message: string; [key: string]: any},
  fn: (logger: Logger) => Promise<void>,
) {
  const txLogger = logger.withTransaction({
    txid: event.id,
    event_name: event.name,
    ...otherParams,
  });
  txLogger.info(`${event.name}:received`, `${message} Received`);
  const timer = txLogger.withTimer();
  try {
    await fn(txLogger);
    timer.info(`${event.name}:handled`, `${message} Handled`);
  } catch (ex) {
    timer.error(
      `${event.name}:errored`,
      `${ex.stack || ex.message || ex}`,
      typeof ex === 'object' && ex !== null ? {...ex} : {},
    );
  }
}

webhooks.on('installation_repositories.added', async (e) => {
  await withLog(
    e,
    {
      message: 'Repository installation added',
      repo_owner: e.payload.sender.login,
      count: e.payload.repositories_added.length,
    },
    (logger) => onInstallationRepositoriesAdded(e, logger),
  );
});

webhooks.on('installation.created', async (e) => {
  await withLog(
    e,
    {
      message: 'New Installation',
      repo_owner: e.payload.sender.login,
      count: e.payload.repositories.length,
    },
    (logger) => onInstallation(e, logger),
  );
});

webhooks.on('create', async (e) => {
  await withLog(
    e,
    {
      message: 'Branch or tag created',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      ref_type: e.payload.ref_type,
      ref_name: e.payload.ref,
    },
    (logger) => onCreate(e, logger),
  );
});
webhooks.on('delete', async (e) => {
  await withLog(
    e,
    {
      message: 'Branch or tag deleted',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      ref_type: e.payload.ref_type,
      ref_name: e.payload.ref,
    },
    () => onDelete(e),
  );
});

webhooks.on('pull_request.opened', onPullRequest('Pull Request Opened'));
webhooks.on('pull_request.edited', onPullRequest('Pull Request Edited'));
webhooks.on(
  'pull_request.synchronize',
  onPullRequest('Pull Request Synchronized'),
);

function onPullRequest(message: string) {
  return async (
    e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  ) => {
    await withLog(
      e,
      {
        message,
        repo_id: e.payload.repository.id,
        repo_owner: e.payload.repository.owner.login,
        repo_name: e.payload.repository.name,
        pull_number: e.payload.pull_request.number,
        pull_id: e.payload.pull_request.id,
      },
      (logger) => onPullRequestUpdate(e, logger),
    );
  };
}

webhooks.on('pull_request.closed', async (e) => {
  await withLog(
    e,
    {
      message: 'Pull Request Closed',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      pull_number: e.payload.pull_request.number,
      pull_id: e.payload.pull_request.id,
    },
    (logger) => onPullRequestClosed(e, logger),
  );
});

webhooks.on('push', async (e) => {
  await withLog(
    e,
    {
      message: 'Repository Push',
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
    },
    (logger) => onPush(e, logger),
  );
});

export default webhooks;
