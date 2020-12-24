import DbGitRepository from '@rollingversions/db/git_repositories';
import DbPullRequest from '@rollingversions/db/pull_requests';
import DbGitCommit from '@rollingversions/db/git_commits';
import {
  getPullRequest,
  getPullRequestByNumber,
  createComment,
  updateComment,
  deleteComment,
  setCommitStatus,
  getOpenPullRequests,
  PullRequestsPage,
} from '@rollingversions/github';
import ServerContext, {NonTransactionContext} from '../ServerContext';
import {getCommitByID, upsertCommit} from './Commits';

import {
  renderInitialComment,
  getUrlForChangeLog,
  getShortDescription,
  renderComment,
} from '../../utils/Rendering';
import {APP_URL} from '../environment';
import getPullRequestPackages from '../db-update-jobs/methods/getPullRequestPackages';
import debounceByKey from '../../utils/debounceByKey';

export interface PullRequestWithHeadCommit extends DbPullRequest {
  headCommit: DbGitCommit | null;
}

async function hydrate(
  ctx: ServerContext,
  prPromise: DbPullRequest | null | Promise<DbPullRequest | null>,
): Promise<PullRequestWithHeadCommit | null> {
  const pr = await prPromise;
  if (!pr) return null;
  return {
    ...pr,
    headCommit: pr.head_git_commit_id
      ? await getCommitByID(ctx, pr.head_git_commit_id)
      : null,
  };
}

const debouncePullRequestByGraphQL = debounceByKey<
  DbPullRequest['graphql_id'],
  PullRequestWithHeadCommit | null
>();

// TODO: refresh commit status and comment in case of intermittent errors
// TODO: refresh head commit occasionally in case of droped webhook?

export async function getPullRequestByID(
  ctx: NonTransactionContext,
  id: DbPullRequest['id'],
): Promise<PullRequestWithHeadCommit | null> {
  return await hydrate(ctx, ctx.pull_requests.findOne({id}));
}

export async function upsertPullRequestByGraphID(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  graphID: DbPullRequest['graphql_id'],
  {forceUpdate = false}: {forceUpdate?: boolean} = {},
): Promise<PullRequestWithHeadCommit | null> {
  const onUpdate = (prWithHeadCommit: PullRequestWithHeadCommit) => {
    void refreshStatus(ctx, repo, prWithHeadCommit)
      .then(
        () => refreshComment(ctx, repo, prWithHeadCommit),
        (ex) => {
          ctx.error(`error_writing_status`, ex.stack);
        },
      )
      .catch((ex) => {
        ctx.error(`error_writing_comment`, ex.stack);
      });
    return prWithHeadCommit;
  };
  return debouncePullRequestByGraphQL(graphID, async () => {
    const existingPullRequest = await hydrate(
      ctx,
      ctx.pull_requests.findOne({
        git_repository_id: repo.id,
        graphql_id: graphID,
      }),
    );
    if (!forceUpdate && existingPullRequest !== null) {
      return existingPullRequest;
    }

    const pr = await getPullRequest(ctx, graphID);
    if (!pr) return null;

    const headCommit =
      pr.headRef &&
      (await upsertCommit(ctx, {
        git_repository_id: repo.id,
        commit_sha: pr.headRef.target.oid,
        graphql_id: pr.headRef.target.id,
      }));

    if (existingPullRequest) {
      const [updated] = await ctx.pull_requests.update(
        {id: existingPullRequest.id},
        {
          is_closed: pr.closed || pr.merged,
          is_merged: pr.merged,
          pr_number: pr.number,
          title: pr.title,

          // N.B. we never remove the head commit reference, even after the PR is merged.
          // this lets us continue to use it for fetching the package metadata
          ...(headCommit ? {head_git_commit_id: headCommit.id} : {}),
        },
      );

      return onUpdate({...updated, headCommit});
    } else {
      const [inserted] = await ctx.pull_requests.insert({
        id: pr.databaseId!,
        is_closed: pr.closed || pr.merged,
        is_merged: pr.merged,
        pr_number: pr.number,
        title: pr.title,
        git_repository_id: repo.id,
        graphql_id: graphID,
        ...(headCommit ? {head_git_commit_id: headCommit.id} : {}),
      });

      return onUpdate({...inserted, headCommit});
    }
  });
}

// We cannot update directly from the event, because it is missing the GraphQL ID for the head commit

// export async function upsertPullRequestFromEvent(
//   ctx: ServerContext,
//   repo: DbGitRepository,
//   pullRequest: {
//     id: number;
//     node_id: string;
//     number: number;
//     title: string;
//     closed?: boolean;
//     merged?: boolean;
//     // head: WebhookPayloadPullRequestPullRequestHead;
//     // base: WebhookPayloadPullRequestPullRequestBase;
//   },
// ) {
//   const existingPullRequest = await ctx.pull_requests.findOne({
//     id: pullRequest.id,
//   });
//   if (!existingPullRequest) {
//     const [inserted] = await ctx.pull_requests.insert({
//       id: pullRequest.id,
//       graphql_id: pullRequest.node_id,
//       git_repository_id: repo.id,
//       pr_number: pullRequest.number,
//       title: pullRequest.title,
//       is_merged: pullRequest.merged || false,
//       is_closed: pullRequest.closed || pullRequest.merged || false,
//     });
//     return inserted;
//   }
//   if (
//     existingPullRequest.title !== pullRequest.title ||
//     (typeof pullRequest.closed === 'boolean' &&
//       (pullRequest.merged || pullRequest.closed) !==
//         existingPullRequest.is_closed) ||
//     (typeof pullRequest.merged === 'boolean' &&
//       pullRequest.merged !== existingPullRequest.is_merged)
//   ) {
//     const [updated] = await ctx.pull_requests.update(
//       {id: existingPullRequest.id},
//       {
//         title: pullRequest.title,
//         ...(typeof pullRequest.closed === 'boolean'
//           ? {is_closed: pullRequest.merged || pullRequest.closed}
//           : {}),
//         ...(typeof pullRequest.merged === 'boolean'
//           ? {is_merged: pullRequest.merged}
//           : {}),
//       },
//     );
//     if (!updated) {
//       ctx.throw(
//         `failed_pr_update`,
//         `Failed to update ${pullRequest.number} in ${repo.owner}/${repo.name}`,
//       );
//     }
//     return updated;
//   }
//   return existingPullRequest;
// }

export async function upsertPullRequestByNumber(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  pr_number: number,
): Promise<PullRequestWithHeadCommit | null> {
  const existingPullRequest = await hydrate(
    ctx,
    ctx.pull_requests.findOne({
      git_repository_id: repo.id,
      pr_number,
    }),
  );
  if (existingPullRequest !== null) return existingPullRequest;

  const pr = await getPullRequestByNumber(ctx, {
    repoID: repo.graphql_id,
    pr_number,
  });
  if (!pr) return null;

  const headCommit =
    pr.headRef &&
    (await upsertCommit(ctx, {
      git_repository_id: repo.id,
      commit_sha: pr.headRef.target.oid,
      graphql_id: pr.headRef.target.id,
    }));

  const [inserted] = await ctx.pull_requests.insertOrUpdate(['id'], {
    id: pr.databaseId!,
    is_closed: pr.closed || pr.merged,
    is_merged: pr.merged,
    pr_number,
    title: pr.title,
    git_repository_id: repo.id,
    graphql_id: pr.id,
    ...(headCommit ? {head_git_commit_id: headCommit.id} : {}),
  });

  const prWithHeadCommit = pr.headRef
    ? await upsertCommit(ctx, {
        git_repository_id: repo.id,
        graphql_id: pr.headRef.target.id,
        commit_sha: pr.headRef.target.oid,
      }).then((headCommit) => ({...inserted, headCommit}))
    : {...inserted, headCommit: null};

  void refreshStatus(ctx, repo, prWithHeadCommit)
    .then(
      () => refreshComment(ctx, repo, prWithHeadCommit),
      (ex) => {
        ctx.error(`error_writing_status`, ex.stack);
      },
    )
    .catch((ex) => {
      ctx.error(`error_writing_comment`, ex.stack);
    });

  return prWithHeadCommit;
}

export async function onChangeLogUpdated(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  pullRequestID: DbPullRequest['id'],
  submittedAtGitSha: string | null,
) {
  const [updated] = await ctx.pull_requests.update(
    {id: pullRequestID},
    {change_set_submitted_at_git_commit_sha: submittedAtGitSha},
  );
  const prWithHeadCommit = await hydrate(ctx, updated);
  if (!prWithHeadCommit) {
    throw new Error('Unable to update pull request');
  }
  await refreshStatus(ctx, repo, prWithHeadCommit);
  await refreshComment(ctx, repo, prWithHeadCommit);
}

const refreshStatusDebounce = debounceByKey<
  DbPullRequest['id'],
  PullRequestWithHeadCommit
>();
async function refreshStatus(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  pr: PullRequestWithHeadCommit,
) {
  return await refreshStatusDebounce(pr.id, async () => {
    if (pr.headCommit && !pr.is_closed) {
      const changes = await ctx.change_log_entries
        .find({pull_request_id: pr.id})
        .all();
      const packagesToRelease = [
        ...new Set(changes.map((c) => c.package_name)),
      ];

      const state =
        pr.headCommit.commit_sha === pr.change_set_submitted_at_git_commit_sha
          ? ('success' as const)
          : ('pending' as const);
      const url = getUrlForChangeLog(
        {
          repo,
          number: pr.pr_number,
        },
        APP_URL,
      );
      const description = getShortDescription({
        headSha: pr.headCommit.commit_sha,
        submittedAtCommitSha: pr.change_set_submitted_at_git_commit_sha,
        packagesToRelease,
      });

      const status = await ctx.git_commit_status.findOne({
        commit_id: pr.headCommit.id,
      });
      if (
        status &&
        status.state === state &&
        status.url === url.href &&
        status.description === description
      ) {
        return pr;
      }

      await setCommitStatus(
        ctx,
        {owner: repo.owner, name: repo.name, sha: pr.headCommit.commit_sha},
        {state, url, description},
      );

      await ctx.git_commit_status.insertOrUpdate(['commit_id'], {
        commit_id: pr.headCommit.id,
        state,
        url: url.href,
        description,
      });
    }
    return pr;
  });
}

const refreshCommentDebounce = debounceByKey<
  DbPullRequest['id'],
  PullRequestWithHeadCommit
>();
async function refreshComment(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  pr: PullRequestWithHeadCommit,
) {
  return await refreshCommentDebounce(pr.id, async () => {
    const commentBody = pr.change_set_submitted_at_git_commit_sha
      ? renderComment(
          {
            repo: {owner: repo.owner, name: repo.name},
            number: pr.pr_number,
            headSha: pr.headCommit?.commit_sha ?? null,
          },
          pr.change_set_submitted_at_git_commit_sha,
          // TODO: This part is potentially very slow, we should be able to do something a bit quicker/simpler
          await getPullRequestPackages(ctx, repo, pr),
          APP_URL,
        )
      : renderInitialComment(
          {
            repo: {owner: repo.owner, name: repo.name},
            number: pr.pr_number,
          },
          APP_URL,
        );

    const freshPR = await ctx.pull_requests.findOne({id: pr.id});
    if (!freshPR) ctx.throw(`missing_pr`, `Missing pull request id ${pr.id}`);

    if (freshPR.comment_id === null) {
      // write comment
      const commentID = await createComment(
        ctx,
        {
          owner: repo.owner,
          name: repo.name,
          pr_number: pr.pr_number,
        },
        commentBody,
      );
      const updated = await ctx.pull_requests.update(
        {id: pr.id, comment_id: null},
        {comment_id: commentID, comment_body: commentBody},
      );
      if (!updated.length) {
        await deleteComment(ctx, {
          owner: repo.owner,
          name: repo.name,
          comment_id: commentID,
        });
      } else {
        // TODO: remove any duplicate comments
      }
    } else if (freshPR.comment_body !== commentBody) {
      // update comment
      await updateComment(
        ctx,
        {
          owner: repo.owner,
          name: repo.name,
          pr_number: pr.pr_number,
          comment_id: freshPR.comment_id,
        },
        commentBody,
      );
      await ctx.pull_requests.update({id: pr.id}, {comment_body: commentBody});
    }
    return pr;
  });
}

export async function refreshOpenPullRequests(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
) {
  let page: PullRequestsPage | null | undefined = await getOpenPullRequests(
    ctx,
    {
      repoID: repo.graphql_id,
    },
  );
  while (page) {
    await Promise.all(
      (page.nodes ?? []).map(
        (pr) => pr && upsertPullRequestByGraphID(ctx, repo, pr.id),
      ),
    );
    page = page.pageInfo.hasNextPage
      ? await getOpenPullRequests(ctx, {
          repoID: repo.graphql_id,
          after: page.pageInfo.endCursor,
        })
      : null;
  }
  await ctx.git_repositories.update(
    {id: repo.id},
    {pull_requests_refreshed_at: new Date()},
  );
}
