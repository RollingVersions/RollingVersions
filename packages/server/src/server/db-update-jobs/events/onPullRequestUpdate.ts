import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import upsertPullRequest from '../procedures/upsertPullRequest';
import upsertCommits from '../procedures/upsertCommits';
import {getAllPullRequestCommits} from '../../services/github';

export default async function onPullRequestUpdate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const client = getClientForEvent(e);
  const git_repository_id = e.payload.repository.id;
  const repo = {
    owner: e.payload.repository.owner.login,
    name: e.payload.repository.name,
  };

  await upsertPullRequest(
    db,
    client,
    git_repository_id,
    repo,
    e.payload.pull_request.number,
  );

  await upsertCommits(
    db,
    client,
    e.payload.repository.id,
    repo,
    getAllPullRequestCommits(client, repo, e.payload.pull_request.number),
  );
}
