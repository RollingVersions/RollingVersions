import db from '@rollingversions/db';
import type {PullRequest} from 'rollingversions/lib/types';

import type {PullRequestResponse} from '../../../types';
import type {Logger} from '../../logger';
import {getPullRequestHeadCommit} from '../../models/git';
import {getDetailedPackageManifestsForPullRequest} from '../../models/PackageManifests';
import {getPullRequestFromRestParams} from '../../models/PullRequests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';
import type {Permission, User} from '../utils/checkPermissions';

export default async function getPullRequest(
  client: GitHubClient,
  user: User,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  permission: Permission,
  logger: Logger,
): Promise<PullRequestResponse | null> {
  const repo = await getRepositoryFromRestParams(db, client, pullRequest.repo);
  if (!repo) {
    return null;
  }
  const pr = await getPullRequestFromRestParams(
    db,
    client,
    repo,
    pullRequest.number,
    logger,
  );
  if (!pr) {
    return null;
  }
  const packages = await getDetailedPackageManifestsForPullRequest(
    db,
    client,
    repo,
    pr,
    logger,
  );
  if (!packages) {
    return null;
  }
  const headCommit = await getPullRequestHeadCommit(
    db,
    client,
    repo,
    pr,
    logger,
  );
  logger.info('loaded_change_set', `Loaded change set`, {
    packages_count: packages.size,
    closed: pr.is_closed,
    merged: pr.is_merged,
    repo_owner: repo.owner,
    repo_name: repo.name,
    pull_number: pr.pr_number,
    ...user,
  });

  return {
    permission,
    headSha: headCommit?.commit_sha ?? `unknown_commit`,
    packages,
    closed: pr.is_closed,
    merged: pr.is_merged,
  };
}
