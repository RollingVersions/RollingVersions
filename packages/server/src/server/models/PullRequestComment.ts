import {Queryable, tables} from '@rollingversions/db';
import DbGitCommit from '@rollingversions/db/git_commits';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';

import {renderComment, renderInitialComment} from '../../utils/Rendering';
import {APP_URL} from '../environment';
import {Logger} from '../logger';
import {deleteComment, GitHubClient, writeComment} from '../services/github';
import {getPullRequestHeadCommit} from './git';
import {getDetailedPackageManifestsForPullRequest} from './PackageManifests';

async function getPullRequestInitialComment(
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
): Promise<string> {
  return renderInitialComment(
    {
      repo: {
        owner: repo.owner,
        name: repo.name,
      },
      number: pullRequest.pr_number,
    },
    APP_URL,
  );
}
async function getPullRequestComment(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  headCommit: DbGitCommit | null,
  logger: Logger,
): Promise<string> {
  const getPackagesResult = await getDetailedPackageManifestsForPullRequest(
    db,
    client,
    repo,
    pullRequest,
    logger,
  );
  if (!getPackagesResult) {
    throw new Error(
      `Cannot load package manifests for ${repo.owner}/${repo.name}`,
    );
  }
  return renderComment(
    {
      repo: {owner: repo.owner, name: repo.name},
      number: pullRequest.pr_number,
      headSha: headCommit?.commit_sha ?? null,
    },
    pullRequest.change_set_submitted_at_git_commit_sha,
    getPackagesResult,
    APP_URL,
  );

  // pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  // submittedAtCommitSha: string | null,
  // packages: Map<string, PullRequestPackage>,
  // rollingVersionsUrl: URL,
}

export async function updatePullRequestComment(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  if (pullRequest.change_set_submitted_at_git_commit_sha) {
    const headCommit = await getPullRequestHeadCommit(
      db,
      client,
      repo,
      pullRequest,
      logger,
    );

    const headCommitSha =
      headCommit?.commit_sha ??
      pullRequest.change_set_submitted_at_git_commit_sha;
    if (headCommitSha !== pullRequest.comment_updated_at_commit_sha) {
      await setComment(
        db,
        client,
        repo,
        pullRequest,
        await getPullRequestComment(
          db,
          client,
          repo,
          pullRequest,
          headCommit,
          logger,
        ),
        headCommitSha,
        logger,
      );
    }
  } else if (!pullRequest.comment_id && !pullRequest.is_closed) {
    await setComment(
      db,
      client,
      repo,
      pullRequest,
      await getPullRequestInitialComment(repo, pullRequest),
      null,
      logger,
    );
  }
}

async function setComment(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pr: DbPullRequest,
  commentBody: string,
  headCommitSha: DbGitCommit['commit_sha'] | null,
  _logger: Logger,
) {
  const commentID = await writeComment(
    client,
    {
      repo: {
        owner: repo.owner,
        name: repo.name,
      },
      number: pr.pr_number,
    },
    commentBody,
    pr.comment_id ?? undefined,
  ).catch(async (ex) => {
    if (ex.status === 404 && pr.comment_id) {
      // The comment may have been manually deleted
      // if so, we should re-create it
      const commentID = await writeComment(
        client,
        {
          repo: {
            owner: repo.owner,
            name: repo.name,
          },
          number: pr.pr_number,
        },
        commentBody,
        undefined,
      );
      const updated = await tables.pull_requests(db).update(
        {id: pr.id, comment_id: pr.comment_id},
        {
          comment_id: commentID,
          ...(headCommitSha
            ? {comment_updated_at_commit_sha: headCommitSha}
            : {}),
        },
      );
      if (updated.length === 0) {
        // delete the duplicate comment
        await deleteComment(
          client,
          {
            repo: {
              owner: repo.owner,
              name: repo.name,
            },
            number: pr.pr_number,
          },
          commentID,
        );
        return null;
      } else {
        return commentID;
      }
    }
    throw ex;
  });
  if (commentID === null) {
    // this was a duplicate comment, so we deleted it
    return (await tables.pull_requests(db).findOne({id: pr.id})) ?? pr;
  }
  if (pr.comment_id === null) {
    const updated = await tables.pull_requests(db).update(
      {id: pr.id, comment_id: null},
      {
        comment_id: commentID,
        ...(headCommitSha
          ? {comment_updated_at_commit_sha: headCommitSha}
          : {}),
      },
    );

    // If we added a duplicate comment, we remove it here
    if (updated.length === 0) {
      await deleteComment(
        client,
        {
          repo: {
            owner: repo.owner,
            name: repo.name,
          },
          number: pr.pr_number,
        },
        commentID,
      );
      return (await tables.pull_requests(db).findOne({id: pr.id})) ?? pr;
    } else {
      return updated[0];
    }
  } else if (headCommitSha) {
    const updated = await tables
      .pull_requests(db)
      .update({id: pr.id}, {comment_updated_at_commit_sha: headCommitSha});
    return updated[0] ?? pr;
  } else {
    return pr;
  }
}
