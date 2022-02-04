import {
  Queryable,
  tables,
  DbGitCommit,
  DbGitRepository,
  DbPullRequest,
} from '@rollingversions/db';

import {getUrlForChangeLog} from '../../utils/Rendering';
import {APP_URL} from '../environment';
import {Logger} from '../logger';
import {GitHubClient, updateCommitStatus} from '../services/github';
import {getPullRequestHeadCommit} from './git';

async function getPullRequestStatus(
  db: Queryable,
  pullRequest: DbPullRequest,
  headCommit: DbGitCommit,
) {
  if (pullRequest.change_set_submitted_at_git_commit_sha === null) {
    return {
      state: 'pending',
      description: 'please add a changelog',
    } as const;
  } else if (
    // TODO: also take this path if the "config" says to allow changes after change log is created
    pullRequest.change_set_submitted_at_git_commit_sha === headCommit.commit_sha
  ) {
    const packagesToRelease = new Set(
      (
        await tables
          .change_log_entries(db)
          .find({pull_request_id: pullRequest.id})
          .select(`package_name`)
          .all()
      ).map((c) => c.package_name),
    );

    return {
      state: 'success',
      description:
        packagesToRelease.size === 0
          ? `no changes to release`
          : packagesToRelease.size === 1
          ? `releasing ${[...packagesToRelease][0]}`
          : `releasing multiple packages`,
    } as const;
  } else {
    return {
      state: 'pending',
      description: `please update the changelog`,
    } as const;
  }
}

export async function updatePullRequestStatus(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  if (pullRequest.is_closed) {
    return null;
  }

  const headCommit = await getPullRequestHeadCommit(
    db,
    client,
    repo,
    pullRequest,
    logger,
  );

  if (
    headCommit &&
    headCommit.commit_sha !== pullRequest.status_updated_at_commit_sha
  ) {
    const url = getUrlForChangeLog(
      {
        repo: {
          owner: repo.owner,
          name: repo.name,
        },
        number: pullRequest.pr_number,
      },
      APP_URL,
    );
    const {state, description} = await getPullRequestStatus(
      db,
      pullRequest,
      headCommit,
    );
    await updateCommitStatus(client, repo, headCommit, {
      url,
      state,
      description,
    });
    await tables
      .pull_requests(db)
      .update(
        {id: pullRequest.id},
        {status_updated_at_commit_sha: headCommit.commit_sha},
      );
  }

  return headCommit;
}
