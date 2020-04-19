import WebhooksApi from '@octokit/webhooks';
import {getClientForEvent} from '../getClient';
import updatePullRequest from '../actions/updatePullRequest';
import log from '../logger';

export default async function onPullRequestUpdate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const {
    payload: {
      repository: {
        owner: {login: owner},
        name,
      },
      pull_request: {
        number: pullNumber,
        head: {sha: headSha},
      },
    },
  } = e;
  log({
    event_status: 'ok',
    event_type: 'pr_update_event_received',
    message: `Update event received for ${owner}/${name}#${pullNumber} to ${headSha}`,
    event_id: e.id,
    repo_owner: owner,
    repo_name: name,
    pull_number: pullNumber,
    head_sha: headSha,
  });
  const client = getClientForEvent(e);
  try {
    await updatePullRequest(client, {
      repo: {
        owner,
        name,
      },
      number: pullNumber,
      headSha,
    });
    log({
      event_status: 'ok',
      event_type: 'pr_updated',
      message: `Updated ${owner}/${name}#${pullNumber} to ${headSha}`,
      event_id: e.id,
      repo_owner: owner,
      repo_name: name,
      pull_number: pullNumber,
      head_sha: headSha,
    });
  } catch (ex) {
    log({
      event_status: 'error',
      event_type: 'pr_update_failed',
      message: `Failed to update ${owner}/${name}#${pullNumber} to ${headSha}:\n\n${ex.stack ||
        ex.message ||
        ex}`,
      event_id: e.id,
      repo_owner: owner,
      repo_name: name,
      pull_number: pullNumber,
      head_sha: headSha,
    });
    throw ex;
  }
}
