import WebhooksApi from '@octokit/webhooks';
import {WEBHOOK_SECRET} from '../environment';
import onInstallation from './onInstallation';
import onPullRequestUpdate from './onPullRequestUpdate';
import onRelease from './onRelease';
import onPush from './onPush';

const webhooks = new WebhooksApi({secret: WEBHOOK_SECRET});

webhooks.on('installation.created', onInstallation);
webhooks.on('installation.new_permissions_accepted', onInstallation);

webhooks.on('pull_request.opened', onPullRequestUpdate);
webhooks.on('pull_request.edited', onPullRequestUpdate);
webhooks.on('pull_request.synchronize', onPullRequestUpdate);

webhooks.on('release', onRelease);
webhooks.on('push', onPush);

export default webhooks;
