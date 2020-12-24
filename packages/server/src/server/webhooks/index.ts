import WebhooksApi from '@octokit/webhooks';
import {WEBHOOK_SECRET} from '../environment';
import {getErrorContext} from '../logger';
import onPullRequestClosed from '../db-update-jobs/events/onPullRequestClosed';
import onInstallationRepositoriesAdded from '../db-update-jobs/events/onInstallationRepositoriesAdded';
import onInstallation from '../db-update-jobs/events/onInstallation';
import onCreate from '../db-update-jobs/events/onCreate';
import onDelete from '../db-update-jobs/events/onDelete';
import onPullRequestUpdate from '../db-update-jobs/events/onPullRequestUpdate';
import onPush from '../db-update-jobs/events/onPush';
import {
  createServerContextForEvent,
  NonTransactionContext,
} from '../ServerContext';

const webhooks = new WebhooksApi({secret: WEBHOOK_SECRET});

function eventHandler<
  TEvent extends {
    readonly id: string;
    readonly name: string;
    readonly payload: unknown;
  }
>(fn: (ctx: NonTransactionContext, e: TEvent) => Promise<void>) {
  return async (e: TEvent) => {
    const ctx = createServerContextForEvent(e);
    ctx.info(`${e.name}:received`, `${e.name} Received`);
    const timer = ctx.startTimer();
    try {
      await fn(ctx, e);
      timer.info(`${e.name}:handled`, `${e.name} Handled`);
    } catch (ex) {
      const err = getErrorContext(ex);
      if (err) {
        timer.error(err.code, err.message, err.context);
      } else {
        timer.error(
          `${e.name}:errored`,
          `${ex.stack || ex.message || ex}`,
          typeof ex === 'object' && ex !== null ? {...ex} : {},
        );
      }
    }
  };
}

webhooks.on(
  'installation_repositories.added',
  eventHandler(onInstallationRepositoriesAdded),
);

webhooks.on('installation.created', eventHandler(onInstallation));

webhooks.on('create', eventHandler(onCreate));
webhooks.on('delete', eventHandler(onDelete));

webhooks.on('pull_request.opened', eventHandler(onPullRequestUpdate));
webhooks.on('pull_request.edited', eventHandler(onPullRequestUpdate));
webhooks.on('pull_request.synchronize', eventHandler(onPullRequestUpdate));

webhooks.on('pull_request.closed', eventHandler(onPullRequestClosed));

webhooks.on('push', eventHandler(onPush));

export default webhooks;
