import WebhooksApi from '@octokit/webhooks';
import {WEBHOOK_SECRET} from '../environment';
import log from '../logger';
import onPullRequestClosed from '../db-update-jobs/events/onPullRequestClosed';
import onInstallationRepositoriesAdded from '../db-update-jobs/events/onInstallationRepositoriesAdded';
import onInstallation from '../db-update-jobs/events/onInstallation';
import onCreate from '../db-update-jobs/events/onCreate';
import onDelete from '../db-update-jobs/events/onDelete';
import onPullRequestUpdate from '../db-update-jobs/events/onPullRequestUpdate';

const webhooks = new WebhooksApi({secret: WEBHOOK_SECRET});

async function withLog(
  fn: () => Promise<void>,
  {
    event_type,
    message,
    ...otherPrams
  }: {event_type: string; message: string; [key: string]: any},
) {
  log({
    ...otherPrams,
    event_status: 'ok',
    event_type: `${event_type}:received`,
    message: `${message} Received`,
  });
  try {
    await fn();
    log({
      ...otherPrams,
      event_status: 'ok',
      event_type: `${event_type}:handled`,
      message: `${message} Handled`,
    });
  } catch (ex) {
    log({
      ...otherPrams,
      ...ex,
      event_status: 'error',
      event_type: `${event_type}:errored`,
      message: `${ex.stack || ex.message || ex}`,
    });
  }
}

webhooks.on('installation_repositories.added', async (e) => {
  await withLog(() => onInstallationRepositoriesAdded(e), {
    event_type: 'installation_repositories.added',
    message: 'Added Repositories',
    event_id: e.id,
    repo_owner: e.payload.sender.login,
    count: e.payload.repositories_added.length,
  });
});

webhooks.on('installation.created', async (e) => {
  await withLog(() => onInstallation(e), {
    event_type: 'installation.created',
    message: 'New Installation',
    event_id: e.id,
    repo_owner: e.payload.sender.login,
    count: e.payload.repositories.length,
  });
});

webhooks.on('create', async (e) => {
  await withLog(() => onCreate(e), {
    event_type: 'create',
    message: 'Branch or tag created',
    event_id: e.id,
    repo_id: e.payload.repository.id,
    repo_owner: e.payload.repository.owner.login,
    repo_name: e.payload.repository.name,
    ref_type: e.payload.ref_type,
    ref_name: e.payload.ref,
  });
});
webhooks.on('delete', async (e) => {
  await withLog(() => onDelete(e), {
    event_type: 'delete',
    message: 'Branch or tag deleted',
    event_id: e.id,
    repo_id: e.payload.repository.id,
    repo_owner: e.payload.repository.owner.login,
    repo_name: e.payload.repository.name,
    ref_type: e.payload.ref_type,
    ref_name: e.payload.ref,
  });
});

webhooks.on(
  'pull_request.opened',
  onPullRequest('pull_request.opened', 'Pull Request Opened'),
);
webhooks.on(
  'pull_request.edited',
  onPullRequest('pull_request.edited', 'Pull Request Edited'),
);
webhooks.on(
  'pull_request.synchronize',
  onPullRequest('pull_request.synchronize', 'Pull Request Synchronize'),
);

function onPullRequest(event_type: string, message: string) {
  return async (
    e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
  ) => {
    await withLog(() => onPullRequestUpdate(e), {
      event_type,
      message,
      event_id: e.id,
      repo_id: e.payload.repository.id,
      repo_owner: e.payload.repository.owner.login,
      repo_name: e.payload.repository.name,
      pull_number: e.payload.pull_request.number,
      pull_id: e.payload.pull_request.id,
    });
  };
}

webhooks.on('pull_request.closed', async (e) => {
  await withLog(() => onPullRequestClosed(e), {
    event_type: 'pull_request.closed',
    message: 'Pull Request Closed',
    event_id: e.id,
    repo_id: e.payload.repository.id,
    repo_owner: e.payload.repository.owner.login,
    repo_name: e.payload.repository.name,
    pull_number: e.payload.pull_request.number,
    pull_id: e.payload.pull_request.id,
  });
});

// TODO: do we need to handle push, or does "create" get called here anyway
// webhooks.on('push', e => {
//   e.payload.
// });

export default webhooks;
