import WebhooksApi from '@octokit/webhooks';
import updateRepo from '../actions/updateRepo';
import {getClientForEvent} from '../getClient';
import log from '../logger';

export default async function onInstallation(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadInstallation>,
) {
  log({
    status: 'ok',
    type: 'install_event_received',
    message: `Install event for ${e.payload.sender.login}`,
    event_id: e.id,
    repo_owner: e.payload.sender.login,
  });
  const client = getClientForEvent(e);
  for (const r of e.payload.repositories) {
    const [owner, name] = r.full_name.split('/');
    await updateRepo(client, {owner, name});
    log({
      status: 'ok',
      type: 'installed',
      message: `Installed on ${owner}/${name}`,
      event_id: e.id,
      repo_owner: owner,
      repo_name: name,
    });
  }
}
