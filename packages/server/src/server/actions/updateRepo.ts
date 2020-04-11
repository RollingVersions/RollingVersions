import {GitHubClient} from 'rollingversions/lib/services/github';
import {Repository} from 'rollingversions/lib/types';
import LockById from '@authentication/lock-by-id';
import updatePullRequest from './updatePullRequest';

const locks = new LockById();

export default async function updateRepo(
  github: GitHubClient,
  repo: Repository,
) {
  // TODO: pagination & graphql
  await locks.withLock(`${repo.owner}/${repo.name}`, async () => {
    const pulls = (
      await github.rest.pulls.list({
        owner: repo.owner,
        repo: repo.name,
        state: 'open',
        per_page: 100,
      })
    ).data;
    for (const pull of pulls) {
      await updatePullRequest(github, {
        repo: {owner: repo.owner, name: repo.name},
        number: pull.number,
        headSha: pull.head.sha,
      });
    }
  });
}
