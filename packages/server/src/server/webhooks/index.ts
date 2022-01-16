import {readFileSync} from 'fs';

import {PubSub} from '@google-cloud/pubsub';
import type {WebhookEvent} from '@octokit/webhooks';
import WebhooksApi from '@octokit/webhooks';
import * as t from 'funtypes';

import {WEBHOOK_SECRET} from '../environment';
import logger from '../logger';
import type {Logger} from '../logger';
import onCreate from './events/onCreate';
import onDelete from './events/onDelete';
import onInstallation from './events/onInstallation';
import onInstallationRepositoriesAdded from './events/onInstallationRepositoriesAdded';
import onPullRequestClosed from './events/onPullRequestClosed';
import onPullRequestUpdate from './events/onPullRequestUpdate';
import onPush from './events/onPush';

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
  } catch (ex: any) {
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
    () => onDelete(e, logger),
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

webhooks.on('error', (error) => {
  console.error(
    `Error occured in "${
      (error as {event?: {name: string}}).event?.name
    } handler: ${error.stack}"`,
  );
});

export default webhooks;

const WebhookEventSchema = t.Object({
  environment: t.String,
  id: t.String,
  name: t.String,
  payload: t.Unknown,
  signature: t.String,
});

export function pullWebhookEvents(
  keyFilename: string,
  subscriptionName: string,
) {
  const projectId = JSON.parse(readFileSync(keyFilename, 'utf8')).project_id;
  const pubsub = new PubSub({
    projectId,
    keyFilename,
  });
  pubsub
    .subscription(subscriptionName)
    .on(
      `message`,
      (message: {
        id: string;
        data: Buffer;
        attributes: {[key: string]: string};
        deliveryAttempt: number;
        publishTime: Date;
        received: Date;
        ack(): void;
        nack(): void;
      }) => {
        void (async () => {
          try {
            let messageData: unknown;
            try {
              messageData = JSON.parse(message.data.toString(`utf8`));
            } catch (ex: any) {
              logger.error(
                `failed_to_parse_pubsub_event`,
                `Failed to parse pubsub event`,
                {
                  error_message: ex.message,
                },
              );
              // there is no point retrying if the message is not valid JSON
              message.ack();
              return;
            }
            const parsedEvent = WebhookEventSchema.safeParse(messageData);
            if (!parsedEvent.success) {
              logger.error(
                `failed_to_parse_pubsub_event`,
                `Failed to parse pubsub event`,
                {error_message: t.showError(parsedEvent)},
              );
              // there is no point retrying if the message doesn't match the schema
              message.ack();
              return;
            }
            const e = parsedEvent.value;
            await webhooks.verifyAndReceive({
              id: e.id,
              name: e.name,
              payload: e.payload,
              signature: e.signature,
            });
            message.ack();
          } catch (ex: any) {
            logger.error(`failed_to_process_pubsub_event`, ex.message, {
              message: {...message, data: message.data.toString(`utf8`)},
              stack: ex.stack,
            });
            message.nack();
          }
        })();
      },
    );
}
