import {readFileSync} from 'fs';

import {PubSub} from '@google-cloud/pubsub';
import assertNever from 'assert-never';
import * as t from 'funtypes';

import logger from '../logger';
import type {Logger} from '../logger';
import {
  GitHubEvent,
  GitHubEventSchema,
  IGNORED_EVENT_NAMES,
  PullRequestEvent,
} from './event-types';
import onCreate from './events/onCreate';
import onDelete from './events/onDelete';
import onInstallation from './events/onInstallation';
import onInstallationRepositories from './events/onInstallationRepositories';
import onPullRequest from './events/onPullRequest';
import onPush from './events/onPush';

const eventHandlers: {
  [TName in GitHubEvent['name']]: (
    event: Extract<GitHubEvent, {readonly name: TName}>,
    logger: Logger,
  ) => Promise<void>;
} = {
  create: onCreate,
  delete: onDelete,
  installation_repositories: onInstallationRepositories,
  installation: onInstallation,
  pull_request: onPullRequest,
  push: onPush,
  github_app_authorization: async () => {
    // TODO
  },
};

const WebhookEventSchema = t.Object({
  environment: t.String,
  id: t.String,
  name: t.String,
  payload: t.Unknown,
  signature: t.String,
});

async function handleWebhookEvent(
  webhookEvent: t.Static<typeof WebhookEventSchema>,
): Promise<boolean> {
  const parsedEvent = GitHubEventSchema.safeParse({
    id: webhookEvent.id,
    name: webhookEvent.name,
    payload: webhookEvent.payload,
  });
  if (!parsedEvent.success) {
    logger.error(`invalid_webhook_event`, t.showError(parsedEvent), {
      id: webhookEvent.id,
      name: webhookEvent.name,
    });
    return false;
  }
  const event = parsedEvent.value;

  const {message, ...context} = getEventContext(event);
  const txLogger = logger.withTransaction({
    txid: event.id,
    event_name: event.name,
    event_action: (event.payload as any).action ?? null,
    ...context,
  });
  txLogger.info(`${event.name}:received`, `${message} Received`);
  const timer = txLogger.withTimer();
  try {
    const eventHandler = eventHandlers[event.name] as (
      e: typeof event,
      logger: Logger,
    ) => Promise<void>;
    await eventHandler(event, txLogger);
    timer.info(`${event.name}:handled`, `${message} Handled`);
    return true;
  } catch (ex: any) {
    const {stack, message, ...props} =
      typeof ex === 'object' && ex !== null
        ? ex
        : {message: `${ex}`, stack: undefined};
    timer.error(`${event.name}:errored`, `${stack ?? message}`, props);
    return false;
  }
}

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
            if (IGNORED_EVENT_NAMES.includes(e.name)) {
              message.ack();
            } else if (await handleWebhookEvent(e)) {
              message.ack();
            } else {
              message.nack();
            }
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

function getEventContext(
  e: GitHubEvent,
): {
  message: string;
  repo_id?: number;
  repo_owner?: string;
  repo_name?: string;
  ref_type?: string;
  ref_name?: string;
  pull_number?: number;
  pull_id?: number;
  count?: number;
} {
  switch (e.name) {
    case 'github_app_authorization':
      switch (e.payload.action) {
        case 'revoked':
          return {
            message: 'GitHub App Authorization Revoked',
            repo_owner: e.payload.sender.login,
          };
        default:
          return assertNever(e.payload.action);
      }
    case 'installation_repositories':
      switch (e.payload.action) {
        case 'added':
          return {
            message: 'Repository installation added',
            repo_owner: e.payload.sender.login,
            count: e.payload.repositories_added.length,
          };
        default:
          return assertNever(e.payload.action);
      }
    case 'installation':
      switch (e.payload.action) {
        case 'created':
          return {
            message: 'New Installation',
            repo_owner: e.payload.sender.login,
            count: e.payload.repositories.length,
          };
        case 'suspend':
          return {
            message: 'Installation Suspended',
            repo_owner: e.payload.sender.login,
          };
        default:
          return assertNever(e.payload);
      }
    case 'create':
      return {
        message: 'Branch or tag created',
        repo_id: e.payload.repository.id,
        repo_owner: e.payload.repository.owner.login,
        repo_name: e.payload.repository.name,
        ref_type: e.payload.ref_type,
        ref_name: e.payload.ref,
      };
    case 'delete':
      return {
        message: 'Branch or tag deleted',
        repo_id: e.payload.repository.id,
        repo_owner: e.payload.repository.owner.login,
        repo_name: e.payload.repository.name,
        ref_type: e.payload.ref_type,
        ref_name: e.payload.ref,
      };
    case 'pull_request':
      return {
        message: getPullRequestEventMessage(e),
        repo_id: e.payload.repository.id,
        repo_owner: e.payload.repository.owner.login,
        repo_name: e.payload.repository.name,
        pull_number: e.payload.pull_request.number,
        pull_id: e.payload.pull_request.id,
      };
    case 'push':
      return {
        message: 'Repository Push',
        repo_id: e.payload.repository.id,
        repo_owner: e.payload.repository.owner.login,
        repo_name: e.payload.repository.name,
      };
    default:
      return assertNever(e);
  }
}

function getPullRequestEventMessage(e: PullRequestEvent): string {
  switch (e.payload.action) {
    case 'opened':
      return 'Pull Request Opened';
    case 'closed':
      return 'Pull Request Closed';
    case 'edited':
      return 'Pull Request Edited';
    case 'labeled':
      return 'Pull Request Labeled';
    case 'unlabeled':
      return 'Pull Request Unlabeled';
    case 'synchronize':
      return 'Pull Request Synchronized';
    case 'auto_merge_enabled':
      return 'Auto-Merge Enabled for Pull Request';
    case 'auto_merge_disabled':
      return 'Auto-Merge Disabled for Pull Request';
    case 'review_requested':
      return 'Review Requested for Pull Request';
    case 'review_request_removed':
      return 'Review Request Removed for Pull Request';
    case 'ready_for_review':
      return 'Pull Request Ready for Review';
    case 'assigned':
      return 'Pull Request Assigned';
    default:
      return assertNever(e.payload.action);
  }
}
