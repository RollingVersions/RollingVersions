import {sql, SQLQuery} from '@databases/pg';
import {anyOf} from '@databases/pg-typed';
import IsolationLevel from '@databases/pg/lib/types/IsolationLevel';
import {q} from '@rollingversions/db';
import DbChangeLogEntry from '@rollingversions/db/change_log_entries';
import DbGitCommit, {
  GitCommits_InsertParameters,
} from '@rollingversions/db/git_commits';
import {GitCommitParents_InsertParameters} from '@rollingversions/db/git_commit_parents';
import DbGitCommitParentCursor from '@rollingversions/db/git_commit_parent_cursors';
import {GitCommitParentShas_InsertParameters} from '@rollingversions/db/git_commit_parent_shas';
import {GitCommitPullRequests_InsertParameters} from '@rollingversions/db/git_commit_pull_requests';
import DbGitRepository from '@rollingversions/db/git_repositories';
import {CommitHistory, getCommitHistory} from '@rollingversions/github';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import createEvent from '../../utils/createEvent';
import dedupeByKey from '../../utils/dedupeByKey';
import logger from '../logger';
import ServerContext, {NonTransactionContext} from '../ServerContext';
import {upsertPullRequestByGraphID} from './PullRequests';

// TODO: on new commit, kickoff background process to load commit history
const newCommits = createEvent<
  [ctx: NonTransactionContext, commit: DbGitCommit]
>();
const dedupeUpsertCommit = dedupeByKey<
  DbGitCommit['graphql_id'],
  DbGitCommit
>();

export async function upsertCommit(
  ctx: ServerContext,
  commit: {
    commit_sha: string;
    git_repository_id: DbGitRepository['id'];
    graphql_id: string;
  },
) {
  return dedupeUpsertCommit(commit.graphql_id, async () => {
    const existing = await ctx.git_commits.findOne({
      commit_sha: commit.commit_sha,
      git_repository_id: commit.git_repository_id,
    });
    if (existing) return existing;

    const [inserted] = await ctx.git_commits.insertOrIgnore({
      commit_sha: commit.commit_sha,
      git_repository_id: commit.git_repository_id,
      graphql_id: commit.graphql_id,
      has_package_manifests: false,
      loaded_related_data: false,
    });
    if (inserted) {
      void newCommits.emit(ctx.escapeTransaction(), inserted).catch((ex) => {
        logger.error('new_commit_error', ex?.stack || ex?.message || ex, {
          commit_sha: commit.commit_sha,
          git_repository_id: commit.git_repository_id,
        });
      });
      return inserted;
    }

    const existing2 = await ctx.git_commits.findOne({
      commit_sha: commit.commit_sha,
      git_repository_id: commit.git_repository_id,
    });
    if (!existing2) {
      ctx.throw(
        `failed_commit_insert`,
        `Unable to insert git commit ${commit.commit_sha} into ${commit.git_repository_id}`,
      );
    }
    return existing2;
  });
}

const dedupeGetCommitByID = dedupeByKey<
  DbGitCommit['id'],
  DbGitCommit | null
>();
export async function getCommitByID(ctx: ServerContext, id: DbGitCommit['id']) {
  return dedupeGetCommitByID(id, () => ctx.git_commits.findOne({id}));
}

type CommitLoaderResult =
  | {kind: 'ok'}
  | {kind: 'commit_error'; id: DbGitCommit['id']; error: Error}
  | {kind: 'cursor_error'; id: DbGitCommitParentCursor['id']; error: Error};

async function onPageOfCommits(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  headCommit: Pick<DbGitCommit, 'graphql_id'>,
  page: CommitHistory,
) {
  // we upsert related pull requests before the transaction starts
  const commits = await Promise.all(
    (page.nodes ?? []).filter(isTruthy).map(async (commit) => ({
      ...commit,
      associatedPullRequests: (
        await Promise.all(
          (commit.associatedPullRequests?.nodes ?? [])
            .filter(isTruthy)
            .filter((n) => n.repository.databaseId === repo.id)
            .map((n) => upsertPullRequestByGraphID(ctx, repo, n.id)),
        )
      ).filter(isTruthy),
    })),
  );

  await ctx.tx(
    async (ctx) => {
      // load all relevant, existing commits
      const commitDbRecordsBySha = new Map(
        (
          await ctx.git_commits
            .find({
              git_repository_id: repo.id,
              commit_sha: anyOf(
                new Set([
                  ...commits.map((c) => c.oid),
                  ...commits
                    .flatMap((c) => c.parents.nodes?.map((c) => c?.oid))
                    .filter(isTruthy),
                ]),
              ),
            })
            .all()
        ).map((c) => [c.commit_sha, c]),
      );

      // insert any new commits
      const newCommits = new Map(
        (
          await ctx.git_commits.insert(
            ...commits
              .filter((c) => !commitDbRecordsBySha.has(c.oid))
              .map(
                (commit): GitCommits_InsertParameters => ({
                  git_repository_id: repo.id,
                  commit_sha: commit.oid,
                  graphql_id: commit.id,
                  has_package_manifests: false,
                  loaded_related_data: false,
                }),
              ),
          )
        ).map((c) => [c.commit_sha, c]),
      );
      for (const [sha, c] of newCommits) {
        commitDbRecordsBySha.set(sha, c);
      }

      // move any references to the newly imported commits from their sha to their ID
      if (newCommits.size) {
        const parentsToReplace = await ctx.git_commit_parent_shas
          .find({
            git_repository_id: repo.id,
            parent_git_commit_sha: anyOf(newCommits.keys()),
          })
          .all();
        if (parentsToReplace.length) {
          await ctx.git_commit_parents.insert(
            ...parentsToReplace.map(
              (p): GitCommitParents_InsertParameters => ({
                child_git_commit_id: p.child_git_commit_id,
                parent_git_commit_id: newCommits.get(p.parent_git_commit_sha)!
                  .id,
              }),
            ),
          );

          await ctx.git_commit_parent_shas.delete({
            id: q.anyOf(parentsToReplace.map((p) => p.id)),
          });
        }
      }

      // insert any new pull request references
      const insertedPullRequestReferences = (
        await ctx.git_commit_pull_requests.insertOrIgnore(
          ...commits.flatMap((c) => {
            const dbRecord = commitDbRecordsBySha.get(c.oid);
            if (!dbRecord) return [];
            return c.associatedPullRequests.map(
              (pr): GitCommitPullRequests_InsertParameters => ({
                git_commit_id: dbRecord.id,
                pull_request_id: pr.id,
              }),
            );
          }),
        )
      ).filter(isTruthy);

      // get parent commit relationships (and check if we already have the parent commits)
      const parents = commits.flatMap((c) =>
        (c.parents.nodes ?? []).filter(isTruthy).map((p) => {
          const child = commitDbRecordsBySha.get(c.oid);
          const parent = commitDbRecordsBySha.get(p.oid);
          if (!child) throw new Error(`Missing commit ${c.oid} in ${repo.id}`);
          return {child, parent: parent ?? null, parentSha: p.oid};
        }),
      );

      // add git_commit_parent references where we have already inserted the parent commit
      await ctx.git_commit_parents.insertOrIgnore(
        ...parents.flatMap(
          ({parent, child}): GitCommitParents_InsertParameters[] =>
            parent
              ? [
                  {
                    child_git_commit_id: child.id,
                    parent_git_commit_id: parent.id,
                  },
                ]
              : [],
        ),
      );

      // If we inserted pull requests, or we have some missing parent commits,
      // add the git_commit_parent_cursor so we can eventually load the next
      // page, and the git shas of the missing parents.
      if (
        page.pageInfo.endCursor &&
        (parents.some(({parent}) => !parent) ||
          insertedPullRequestReferences.length)
      ) {
        const [cursor] = await ctx.git_commit_parent_cursors.insert({
          git_repository_id: repo.id,
          commit_graph_id: headCommit.graphql_id,
          end_cursor: page.pageInfo.endCursor,
        });
        await ctx.git_commit_parent_shas.insertOrIgnore(
          ...parents.flatMap(
            ({
              parent,
              parentSha,
              child,
            }): GitCommitParentShas_InsertParameters[] =>
              !parent
                ? [
                    {
                      git_repository_id: repo.id,
                      child_git_commit_id: child.id,
                      parent_git_commit_sha: parentSha,
                      parent_cursor_id: cursor.id,
                    },
                  ]
                : [],
          ),
        );
      }
    },
    {
      isolationLevel: IsolationLevel.SERIALIZABLE,
      retrySerializationFailures: true,
    },
  );
}

const dedupeAddMissingCommitData = dedupeByKey<
  DbGitRepository['id'],
  CommitLoaderResult
>();

async function addMissingCommitData(
  ctx: NonTransactionContext,
  {id, git_repository_id}: DbGitCommit,
) {
  const result = await dedupeAddMissingCommitData(
    git_repository_id,
    async () =>
      await Promise.resolve(null)
        .then(async () => {
          const commit = await ctx.git_commits.findOne({id: id});
          if (commit?.loaded_related_data !== false) {
            return;
          }
          const page = await getCommitHistory(ctx, {
            id: commit.graphql_id,
            pageSize: 100,
          }).catch(() => null);
          if (!page) {
            throw new Error(
              `Unable to find the commit with GraphQL ID: ${commit.graphql_id}`,
            );
          }

          const repo = await ctx.git_repositories.findOne({
            id: git_repository_id,
          });
          if (!repo) {
            throw new Error('Missing repo');
          }

          await onPageOfCommits(ctx, repo, commit, page);

          return;
        })
        .then(
          () => ({kind: 'ok'}),
          (error) => ({
            kind: 'commit_error',
            id,
            error,
          }),
        ),
  );
  if (result.kind === 'commit_error' && result.id === id) {
    // Don't throw the error if it was for a different commit because
    // we dedupe by repository ID not by commit ID.
    throw result.error;
  }
}

async function followParentCursor(
  ctx: NonTransactionContext,
  parentCursor: DbGitCommitParentCursor,
) {
  const result = await dedupeAddMissingCommitData(
    parentCursor.git_repository_id,
    async () =>
      await Promise.resolve(null)
        .then(async () => {
          const page = await getCommitHistory(ctx, {
            id: parentCursor.commit_graph_id,
            pageSize: 100,
            after: parentCursor.end_cursor,
          }).catch(() => null);
          if (!page) {
            throw new Error(
              `Unable to find the commit with GraphQL ID: ${parentCursor.commit_graph_id}`,
            );
          }

          const repo = await ctx.git_repositories.findOne({
            id: parentCursor.git_repository_id,
          });
          if (!repo) {
            throw new Error('Missing repo');
          }

          await onPageOfCommits(
            ctx,
            repo,
            {graphql_id: parentCursor.commit_graph_id},
            page,
          );

          await ctx.git_commit_parent_cursors.delete({id: parentCursor.id});

          return;
        })
        .then(
          () => ({kind: 'ok'}),
          (error) => ({
            kind: 'cursor_error',
            id: parentCursor.id,
            error,
          }),
        ),
  );
  if (result.kind === 'cursor_error' && result.id === parentCursor.id) {
    // Don't throw the error if it was for a different cursor because
    // we dedupe by repository ID not by cursor ID.
    throw result.error;
  }
}

async function prepareDifference(
  ctx: NonTransactionContext,
  commits: {
    left: DbGitCommit['id'][];
    right: DbGitCommit['id'][];
  },
) {
  let updated = false;
  let commitDataAvailable = false;
  while (!commitDataAvailable) {
    const loadMore = await ctx.tx(
      async (ctx) => {
        const commitWithoutRelatedData: DbGitCommit | undefined = (
          await ctx.db.query(
            withCommitDifference(
              commits,
              sql`SELECT c.* FROM commits c WHERE NOT c.loaded_related_data LIMIT 1`,
            ),
          )
        )[0];

        if (commitWithoutRelatedData) {
          return (ctx: NonTransactionContext) =>
            addMissingCommitData(ctx, commitWithoutRelatedData);
        }

        const parentCursor: DbGitCommitParentCursor | undefined = (
          await ctx.db.query(
            withCommitDifference(
              commits,
              sql`
                SELECT pc.* FROM commits c
                INNER JOIN git_commit_parent_shas ps ON ps.child_git_commit_id = c.id
                INNER JOIN git_commit_parent_cursors pc ON ps.parent_cursor_id = pc.id
                LIMIT 1
              `,
            ),
          )
        )[0];

        if (parentCursor) {
          return (ctx: NonTransactionContext) =>
            followParentCursor(ctx, parentCursor);
        }

        return null;
      },
      {readOnly: true},
    );
    if (loadMore) {
      updated = true;
      await loadMore(ctx);
    } else {
      commitDataAvailable = true;
    }
  }
  return updated;
}

export async function getAllUnreleasedChanges(
  ctx: NonTransactionContext,
  {
    headCommitID,
    lastReleaseCommitIDs,
  }: {
    headCommitID: DbGitCommit['id'];
    lastReleaseCommitIDs: DbGitCommit['id'][];
  },
): Promise<(DbChangeLogEntry & {pr_number: number})[]> {
  await prepareDifference(ctx, {
    left: [headCommitID],
    right: lastReleaseCommitIDs,
  });

  const changes: (DbChangeLogEntry & {
    pr_number: number;
  })[] = await ctx.db.query(
    withCommitSubtract(
      {
        subtract: lastReleaseCommitIDs,
        from: [headCommitID],
      },
      sql`
          SELECT DISTINCT pr.pr_number, cl.*
          FROM commits c
          INNER JOIN git_commit_pull_requests cp ON (cp.git_commit_id = c.id)
          INNER JOIN pull_requests pr ON (cp.pull_request_id = pr.id)
          INNER JOIN change_log_entries cl ON (cl.pull_request_id = pr.id)
          ORDER BY cl.sort_order_weight, cl.id ASC
        `,
    ),
  );
  return changes;
}

export async function isPullRequestReleased(
  ctx: NonTransactionContext,
  {
    releasedCommitIDs,
    pullRequestID,
  }: {
    releasedCommitIDs: number[];
    pullRequestID: number;
  },
): Promise<boolean> {
  if (!releasedCommitIDs.length) return false;
  const pullRequestCommitIDs = (
    await ctx.db.query(sql`
      SELECT DISTINCT c.id
      FROM git_commits c
      INNER JOIN git_commit_pull_requests cp ON (cp.git_commit_id = c.id)
      INNER JOIN pull_requests pr ON (cp.pull_request_id = pr.id)
      WHERE pr.id = ${pullRequestID}
    `)
  ).map((c): DbGitCommit['id'] => c.id);

  await prepareDifference(ctx, {
    left: releasedCommitIDs,
    right: pullRequestCommitIDs,
  });

  const released = await ctx.db.query(
    withRecursive(
      [selectRecursive(sql`commits`, sql`c.id = ANY(${releasedCommitIDs})`)],
      sql`
        SELECT cp.pull_request_id
        FROM released_commits c
        INNER JOIN git_commit_pull_requests cp ON (cp.git_commit_id = c.id)
        WHERE cp.pull_request_id = ${pullRequestID}
        LIMIT 1
      `,
    ),
  );

  return released.length !== 0;
}

function selectRecursive(
  id: SQLQuery,
  headCondition: SQLQuery,
  andCondition?: SQLQuery,
) {
  return sql`
    ${id} AS (
      SELECT c.* FROM git_commits c WHERE ${
        andCondition
          ? sql.join([headCondition, andCondition], ' AND ')
          : headCondition
      }
      UNION
      SELECT c.* FROM git_commits c
        INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
        INNER JOIN commits_to_exclude ON (cp.child_git_commit_id = commits_to_exclude.id)
        ${andCondition ? sql`WHERE ${andCondition}` : sql``}
    )
  `;
}

function withRecursive(recursiveQueries: SQLQuery[], outerQuery: SQLQuery) {
  return sql`WITH RECURSIVE ${sql.join(recursiveQueries, ', ')} ${outerQuery}`;
}

function withCommitSubtract(
  {
    subtract,
    from,
  }: {
    subtract: DbGitCommit['id'][];
    from: DbGitCommit['id'][];
  },
  query: SQLQuery,
) {
  return withRecursive(
    [
      selectRecursive(sql`commits_to_exclude`, sql`c.id = ANY(${subtract})`),
      selectRecursive(
        sql`commits`,
        sql`c.id = ANY(${from})`,
        sql`c.id NOT IN (select id FROM commits_to_exclude)`,
      ),
    ],
    query,
  );
}

function withCommitDifference(
  {
    left,
    right,
  }: {
    left: DbGitCommit['id'][];
    right: DbGitCommit['id'][];
  },
  query: SQLQuery,
) {
  return withRecursive(
    [
      selectRecursive(sql`l`, sql`c.id = ANY(${left})`),
      selectRecursive(sql`r`, sql`c.id = ANY(${right})`),
      sql`commits AS (
        SELECT l.* FROM l LEFT OUTER JOIN r ON l.id = r.id WHERE r.id IS NULL
        UNION
        SELECT r.* FROM r LEFT OUTER JOIN l ON l.id = r.id WHERE l.id IS NULL
      )`,
    ],
    query,
  );
}
