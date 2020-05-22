import WebhooksApi from '@octokit/webhooks';
import {db} from '../../services/postgres';
import {getClientForEvent} from '../../getClient';
import upsertPullRequest from '../procedures/upsertPullRequest';
import upsertCommits from '../procedures/upsertCommits';
import {getAllPullRequestCommits} from '../../services/github';
import {updateStatus} from 'rollingversions/lib/services/github';
import {APP_URL} from '../../environment';
import {
  getUrlForChangeLog,
  getShortDescription,
} from '../../../utils/Rendering';
import readPullRequestState from '../methods/readPullRequestState';

export default async function onPullRequestUpdate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadPullRequest>,
) {
  const client = getClientForEvent(e);
  const repo = {
    owner: e.payload.repository.owner.login,
    name: e.payload.repository.name,
  };

  const pullRequest = await readPullRequestState(db, client, {
    repo,
    number: e.payload.number,
  });

  if (pullRequest.headSha) {
    const pr = {
      number: e.payload.number,
      repo,
      headSha: pullRequest.headSha,
    };
    await updateStatus(client, pr, {
      state:
        pr.headSha === pullRequest.submittedAtCommitSha ? 'success' : 'pending',
      url: getUrlForChangeLog(pr, APP_URL),
      description: getShortDescription(
        pr,
        pullRequest.submittedAtCommitSha || null,
        pullRequest.packages,
      ),
    });
  }
}
