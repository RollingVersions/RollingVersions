import {PullRequest} from 'rollingversions/lib/types';
import log from '../../logger';
import {Permission, User} from '../utils/checkPermissions';
import {GitHubClient} from '../../services/github';
import {PullRequestResponse} from '../../../types';
import {db} from '../../services/postgres';
import readPullRequestState from '../../db-update-jobs/methods/readPullRequestState';

export default async function getPullRequest(
  client: GitHubClient,
  user: User,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  permission: Permission,
): Promise<PullRequestResponse> {
  const pr = await db.task((db) =>
    readPullRequestState(db, client, pullRequest),
  );

  log({
    event_status: 'ok',
    event_type: 'loaded_change_set',
    message: `Loaded change set`,
    packages_count: pr.packages.size,
    closed: pr.is_closed,
    merged: pr.is_merged,
    repo_owner: pullRequest.repo.owner,
    repo_name: pullRequest.repo.name,
    pull_number: pullRequest.number,
    ...user,
  });

  return {
    permission,
    headSha: pr.headSha,
    packages: pr.packages,
    closed: pr.is_closed,
    merged: pr.is_merged,
    // [
    //   ...(await getUnreleasedPackages(
    //     client,
    //     {
    //       ...pullRequest,
    //       closed: pr.is_closed || pr.is_merged,
    //     },
    //     pr.packages,
    //   )),
    // ],
  };
}
