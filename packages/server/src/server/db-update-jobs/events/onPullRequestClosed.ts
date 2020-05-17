import WebhooksApi from '@octokit/webhooks';
import {updatePullRequest, db} from '../../services/postgres';

export default async function onPullRequestClosed(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const git_repository_id = e.payload.repository.id;
  await updatePullRequest(db, git_repository_id, {
    id: e.payload.pull_request.id,
    title: e.payload.pull_request.title,
    is_closed: true,
    is_merged: e.payload.pull_request.merged,
  });
}
