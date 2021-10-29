import {Writable} from 'stream';
import {URL} from 'url';

import {batch} from '@mavenoid/dataloader';

import type {SQLQuery} from '@rollingversions/db';
import {Queryable, sql} from '@rollingversions/db';
import {q} from '@rollingversions/db';
import {tables} from '@rollingversions/db';
import DbChangeLogEntry from '@rollingversions/db/change_log_entries';
import type {GitCommits_InsertParameters} from '@rollingversions/db/git_commits';
import type DbGitCommit from '@rollingversions/db/git_commits';
import type DbGitRef from '@rollingversions/db/git_refs';
import type {GitRefs_InsertParameters} from '@rollingversions/db/git_refs';
import type DbGitRepository from '@rollingversions/db/git_repositories';
import type DbPullRequest from '@rollingversions/db/pull_requests';
import * as git from '@rollingversions/git-http';
import * as gitObj from '@rollingversions/git-objects';

import BatchStream from '../../utils/BatchStream';
import dedupeByKey from '../../utils/dedupeByKey';
import groupByKey from '../../utils/groupByKey';
import {getTokenForRepo} from '../getClient';
import type {Logger} from '../logger';
import type {GitHubClient} from '../services/github';

function notNull<T>(value: T | null | undefined): T {
  if (value == null) {
    throw new Error(`Expected value but got null or undefined`);
  }
  return value;
}

const CONFLICTING_UPDATES_ERROR = new Error(
  `Two conflicting attempts to update the same git repository were made.`,
);
const dedupe = dedupeByKey<DbGitRepository['id'], void>();
async function getHttpHandler(
  repo: DbGitRepository,
): Promise<git.HttpInterface<Map<string, string>>> {
  const accessToken = await getTokenForRepo(repo);
  const headerValue = `Basic ${Buffer.from(
    `x-access-token:${accessToken}`,
  ).toString(`base64`)}`;
  return {
    ...git.DEFAULT_HTTP_HANDLER,
    createHeaders(url: URL) {
      const headers = git.DEFAULT_HTTP_HANDLER.createHeaders(url);

      // https://docs.github.com/en/developers/apps/authenticating-with-github-apps#http-based-git-access-by-an-installation
      // x-access-token:<token>
      headers.set('Authorization', headerValue);

      return headers;
    },
  };
}

export async function markRepoAsUpdated(
  db: Queryable,
  repo: DbGitRepository,
): Promise<DbGitRepository> {
  let r = repo;
  while (true) {
    const updatedRecords = await tables.git_repositories(db).update(
      {
        id: r.id,
        remote_git_version: r.remote_git_version,
      },
      {remote_git_version: r.remote_git_version + 1},
    );
    if (updatedRecords.length === 1) {
      return updatedRecords[0];
    } else {
      r = notNull(await tables.git_repositories(db).findOne({id: r.id}));
    }
  }
}

export async function updateRepoIfChanged(
  db: Queryable,
  _client: GitHubClient,
  repoID: DbGitRepository['id'],
  logger: Logger,
): Promise<void> {
  return await dedupe(repoID, async () => {
    let repo = notNull(await tables.git_repositories(db).findOne({id: repoID}));
    while (repo.remote_git_version !== repo.local_git_version) {
      const http = await getHttpHandler(repo);
      const repoURL = new URL(
        `https://github.com/${repo.owner}/${repo.name}.git`,
      );

      logger.info(`git_init`, `Git init request ${repoURL.href}`);
      const {capabilities: serverCapabilities} = await git.initialRequest(
        repoURL,
        {
          http,
          agent: 'rollingversions.com',
        },
      );

      logger.info(`git_lsrefs`, `Git ls refs request ${repoURL.href}`);
      const [remoteRefs, localRefs] = await Promise.all([
        git.lsRefs(
          repoURL,
          {
            // TODO: what do we need here?
            // symrefs: true,
            refPrefix: ['refs/heads/', 'refs/tags/', 'refs/pull/'],
          },
          {
            http,
            agent: 'rollingversions.com',
            serverCapabilities,
          },
        ),
        tables
          .git_refs(db)
          .find({
            git_repository_id: repo.id,
          })
          .select(`kind`, `name`, `commit_sha`)
          .all(),
      ]);

      const remoteRefNames = new Set(remoteRefs.map((r) => r.refName));
      const refsToDelete = localRefs.filter(
        (ref) => !remoteRefNames.has(`refs/${ref.kind}/${ref.name}`),
      );
      const localRefsMap = new Map(
        localRefs.map((ref) => [
          `refs/${ref.kind}/${ref.name}`,
          ref.commit_sha,
        ]),
      );
      const refsToUpsert = remoteRefs
        .filter((ref) => ref.objectID !== localRefsMap.get(ref.refName))
        .map(
          (ref): GitRefs_InsertParameters => {
            const match = /^refs\/([^\/]+)\/(.+)$/.exec(ref.refName);
            if (!match) {
              throw new Error(`Invalid ref format "${ref.refName}"`);
            }
            const prRefMatch = /^refs\/pull\/(\d+)\/(head|merge)$/.exec(
              ref.refName,
            );
            return {
              git_repository_id: repo.id,
              kind: match[1],
              name: match[2],
              commit_sha: ref.objectID,
              pr_number: prRefMatch ? parseInt(prRefMatch[1], 10) : null,
              pr_ref_kind: prRefMatch ? prRefMatch[2] : null,
            };
          },
        );

      const localRefShas = new Set(localRefs.map((ref) => ref.commit_sha));
      const missingShas = new Set(
        remoteRefs
          .map((ref) => ref.objectID)
          .filter((objectID) => !localRefShas.has(objectID)),
      );

      if (missingShas.size) {
        logger.info(`git_fetch_objects`, `Git fetch request ${repoURL.href}`);
        const commits = await git.fetchObjects(
          repoURL,
          {
            want: [...missingShas],
            have: [...localRefShas],
            filter: [git.treeDepth(0)],
          },
          {
            http,
            agent: 'rollingversions.com',
            serverCapabilities,
          },
        );

        await new Promise<void>((resolve, reject) => {
          commits
            .on(`error`, reject)
            .pipe(new BatchStream({maxBatchSize: 500}))
            .on(`error`, reject)
            .pipe(
              new Writable({
                objectMode: true,
                write(batch: git.FetchResponseEntryObject[], _encoding, cb) {
                  const commits = batch
                    .map((entry): GitCommits_InsertParameters | null => {
                      if (gitObj.objectIsCommit(entry.body)) {
                        const commit = gitObj.decodeObject(entry.body);
                        // If you use the `-x` option when cherry picking
                        // (see: https://git-scm.com/docs/git-cherry-pick)
                        // it will append the following line to the
                        // commit message:
                        //
                        // (cherry picked from commit <commit-sha>)
                        //
                        // If you repeat that process to cherry pick the
                        // already cherry picked commit into another branch
                        // it will add an additional cherry picked from ...
                        // line
                        const cherryPickedFrom: string[] = [];
                        commit.body.message.replace(
                          /\(cherry picked from commit ([0-9a-f]+)\)/g,
                          (_, sha) => {
                            cherryPickedFrom.push(sha);
                            return _;
                          },
                        );
                        return {
                          git_repository_id: repo.id,
                          commit_sha: entry.hash,
                          message: commit.body.message,
                          parents: commit.body.parents,
                          cherry_picked_from: cherryPickedFrom.length
                            ? cherryPickedFrom
                            : null,
                        };
                      } else {
                        return null;
                      }
                    })
                    .filter(<T>(v: T): v is Exclude<T, null> => v !== null);
                  tables
                    .git_commits(db)
                    .insertOrIgnore(...commits)
                    .then(
                      () => cb(),
                      (err) => cb(err),
                    );
                },
              }),
            )
            .on(`error`, reject)
            .on(`finish`, () => resolve());
        });
      }

      logger.info(`git_update_refs`, `Git update refs ${repoURL.href}`);
      try {
        repo = await db.tx(async (db) => {
          await tables
            .git_refs(db)
            .insertOrUpdate(
              [`git_repository_id`, `kind`, `name`],
              ...refsToUpsert,
            );
          const groupsToDelete = groupByKey(refsToDelete, (r) => r.kind);
          for (const [kind, refs] of groupsToDelete) {
            await tables.git_refs(db).delete({
              git_repository_id: repo.id,
              kind,
              name: q.anyOf(refs.map((r) => r.name)),
            });
          }
          const updated = await tables
            .git_repositories(db)
            .update(
              {id: repo.id, local_git_version: repo.local_git_version},
              {local_git_version: repo.remote_git_version},
            );
          if (updated.length !== 1) {
            throw CONFLICTING_UPDATES_ERROR;
          }
          return updated[0];
        });
      } catch (ex) {
        if (ex !== CONFLICTING_UPDATES_ERROR) {
          throw ex;
        }
        repo = notNull(await tables.git_repositories(db).findOne({id: repoID}));
      }
    }
  });
}

export async function fetchTree(
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
): Promise<
  {
    path: string;
    getContents: () => Promise<string>;
  }[]
> {
  const http = await getHttpHandler(repo);
  const repoURL = new URL(`https://github.com/${repo.owner}/${repo.name}.git`);

  logger.info(`git_init`, `Git init request ${repoURL.href}`);
  const {capabilities: serverCapabilities} = await git.initialRequest(repoURL, {
    http,
    agent: 'rollingversions.com',
  });

  logger.info(`git_fetch_objects`, `Git fetch request ${repoURL.href}`);
  const objects = await git.fetchObjects(
    repoURL,
    {want: [commitSha], filter: [git.blobNone()], deepen: 1},
    {http, agent: 'rollingversions.com', serverCapabilities},
  );

  const trees = new Map<string, gitObj.TreeBody>();
  let rootCommit: gitObj.CommitBody | undefined;
  await new Promise<void>((resolve, reject) => {
    objects
      .on(`error`, reject)
      .pipe(
        new Writable({
          objectMode: true,
          write(entry: git.FetchResponseEntryObject, _encoding, cb) {
            if (gitObj.objectIsCommit(entry.body)) {
              if (entry.hash === commitSha) {
                rootCommit = gitObj.decodeObject(entry.body).body;
              }
            } else if (gitObj.objectIsTree(entry.body)) {
              trees.set(entry.hash, gitObj.decodeObject(entry.body).body);
            }
            cb();
          },
        }),
      )
      .on(`error`, reject)
      .on(`finish`, () => resolve());
  });
  if (!rootCommit) {
    throw new Error(`Could not find commit ${commitSha}`);
  }

  const getObject = batch<string, git.FetchResponseEntryObject>(
    async (want) => {
      const fetchResponse = await git.fetchObjects(
        repoURL,
        {want: [...new Set(want)]},
        {
          http,
          agent: 'rollingversions.com',
          serverCapabilities,
        },
      );

      const entries = new Map<string, git.FetchResponseEntryObject>();
      await new Promise<void>((resolve, reject) => {
        fetchResponse
          .on(`error`, reject)
          .pipe(
            new Writable({
              objectMode: true,
              write(entry: git.FetchResponseEntryObject, _encoding, cb) {
                entries.set(entry.hash, entry);
                cb();
              },
            }),
          )
          .on(`error`, reject)
          .on(`finish`, () => resolve());
      });
      return entries;
    },
  );

  const files: {
    path: string;
    getContents: () => Promise<string>;
  }[] = [];
  const walkTree = (hash: string, parentPath: string) => {
    const tree = trees.get(hash);
    if (!tree) {
      throw new Error(`Could not find tree ${hash}`);
    }
    for (const [name, {mode, hash}] of Object.entries(tree)) {
      const path = parentPath + name;

      if (mode === gitObj.Mode.tree) {
        walkTree(hash, path + '/');
      } else if (mode === gitObj.Mode.file) {
        files.push({
          path,
          getContents: async () => {
            const entry = await getObject(hash);
            if (!entry) {
              throw new Error(`Unable to find object ${hash} at ${path}`);
            }
            if (!gitObj.objectIsBlob(entry.body)) {
              throw new Error(
                `Object ${hash} at ${path} is not a blob, but we expected a blob`,
              );
            }
            const obj = gitObj.decodeObject(entry.body);
            return Buffer.from(obj.body).toString(`utf8`);
          },
        });
      }
    }
  };
  walkTree(rootCommit.tree, ``);

  return files;
}

async function getCommitByRef(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  kind: 'heads' | 'tags' | 'pull',
  name: string,
  logger: Logger,
): Promise<DbGitCommit | null> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const ref = await tables.git_refs(db).findOne({
    git_repository_id: repo.id,
    kind,
    name,
  });
  if (!ref) return null;

  const commit = await tables.git_commits(db).findOne({
    git_repository_id: repo.id,
    commit_sha: ref.commit_sha,
  });
  return commit;
}

export async function getCommitBySha(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
) {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const commit = await tables.git_commits(db).findOne({
    git_repository_id: repo.id,
    commit_sha: commitSha,
  });
  return commit;
}

export async function getTagHeadCommit(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  tagName: string,
  logger: Logger,
) {
  return await getCommitByRef(db, client, repo, `tags`, tagName, logger);
}
export async function getBranchHeadCommit(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  branchName: string,
  logger: Logger,
) {
  return await getCommitByRef(db, client, repo, `heads`, branchName, logger);
}
export async function getPullRequestHeadCommit(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  pullRequest: DbPullRequest,
  logger: Logger,
) {
  return await getCommitByRef(
    db,
    client,
    repo,
    `pull`,
    `${pullRequest.pr_number}/head`,
    logger,
  );
}

function selectRecursiveUnion(q: {
  name: SQLQuery;
  fields: SQLQuery;
  from: SQLQuery;
  where: SQLQuery;
  whereHead: SQLQuery;
  whereJoin: SQLQuery;
}) {
  return sql`
    ${q.name} AS (
      SELECT ${q.fields}
      FROM ${q.from}
      WHERE ${q.where} AND ${q.whereHead}
      UNION
      SELECT ${q.fields}
      FROM ${q.from}
      INNER JOIN ${q.name} ON (${q.where} AND ${q.whereJoin})
    )
  `;
}
const anyValue = (value: Set<string>) =>
  value.size === 1 ? sql`${[...value][0]}` : sql`ANY(${[...value]})`;
function withCherryPickedCommits(q: {
  fields: SQLQuery;
  nameWithoutCherryPicked: SQLQuery;
  repositoryID: DbGitRepository['id'];
  filter?: SQLQuery;
}) {
  return sql`(
    SELECT ${q.fields} FROM ${q.nameWithoutCherryPicked} c
    ${q.filter ? sql`` : sql`WHERE ${q.filter}`}
    UNION
    SELECT ${q.fields} FROM git_commits c
    INNER JOIN ${q.nameWithoutCherryPicked} d
    ON (c.git_repository_id = ${q.repositoryID} AND (
      (c.cherry_picked_from IS NOT NULL AND d.commit_sha = ANY(c.cherry_picked_from)) OR
      (d.cherry_picked_from IS NOT NULL AND c.commit_sha = ANY(d.cherry_picked_from))
    ))
    ${q.filter ? sql`` : sql`WHERE ${q.filter}`}
  )`;
}
function selectCommits({
  repositoryID,
  includedCommits,
  excludedCommits,
}: {
  repositoryID: DbGitRepository['id'];
  includedCommits: Set<string>;
  excludedCommits: Set<string>;
}) {
  const queries = [];
  if (excludedCommits.size) {
    queries.push(
      selectRecursiveUnion({
        name: sql`excluded_commits`,
        fields: sql`c.commit_sha, c.parents, c.cherry_picked_from`,
        from: sql`git_commits c`,
        where: sql`c.git_repository_id = ${repositoryID}`,
        whereHead: sql`c.commit_sha = ${anyValue(excludedCommits)}`,
        whereJoin: sql`c.commit_sha = ANY(excluded_commits.parents)`,
      }),
    );
  }
  queries.push(
    selectRecursiveUnion({
      name: sql`commits`,
      fields: sql`c.*`,
      from: sql`git_commits c`,
      where: excludedCommits.size
        ? sql`c.git_repository_id = ${repositoryID} AND c.commit_sha NOT IN (SELECT commit_sha FROM excluded_commits)`
        : sql`c.git_repository_id = ${repositoryID}`,
      whereHead: sql`c.commit_sha = ${anyValue(includedCommits)}`,
      whereJoin: sql`c.commit_sha = ANY(commits.parents)`,
    }),
  );
  return sql`
    WITH RECURSIVE ${sql.join(queries, `, `)}`;
}

export async function getAllBranches(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
): Promise<DbGitRef[]> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const refs = await tables
    .git_refs(db)
    .find({
      git_repository_id: repo.id,
      kind: 'heads',
    })
    .orderByAsc(`name`)
    .all();
  return refs;
}
export async function getAllTags(
  db: Queryable,
  client: GitHubClient,
  repo: DbGitRepository,
  logger: Logger,
): Promise<DbGitRef[]> {
  await updateRepoIfChanged(db, client, repo.id, logger);

  const refs = await tables
    .git_refs(db)
    .find({
      git_repository_id: repo.id,
      kind: 'tags',
    })
    .orderByAsc(`name`)
    .all();
  return refs;
}

export async function getAllTagsOnBranch(
  db: Queryable,
  headCommit: DbGitCommit,
): Promise<DbGitRef[]> {
  return await db.query(sql`
    ${selectCommits({
      repositoryID: headCommit.git_repository_id,
      includedCommits: new Set([headCommit.commit_sha]),
      excludedCommits: new Set(),
    })}
    SELECT r.*
    FROM git_refs AS r
    INNER JOIN commits AS c ON (r.commit_sha = c.commit_sha)
    WHERE r.git_repository_id = ${headCommit.git_repository_id}
  `);
}

export async function getUnreleasedChanges(
  db: Queryable,
  repo: DbGitRepository,
  {
    packageName,
    headCommitSha,
    releasedCommits,
  }: {
    packageName: string;
    headCommitSha: string;
    releasedCommits: Set<string>;
  },
): Promise<(DbChangeLogEntry & {pr_number: DbPullRequest['pr_number']})[]> {
  return await db.query(sql`
    ${selectCommits({
      repositoryID: repo.id,
      includedCommits: new Set([headCommitSha]),
      excludedCommits: releasedCommits,
    })}
    SELECT DISTINCT ON (change.id) change.*, pr.pr_number
    FROM change_log_entries AS change
    INNER JOIN pull_requests AS pr ON (
      pr.git_repository_id = ${repo.id} AND pr.id = change.pull_request_id
    )
    LEFT OUTER JOIN git_refs AS ref ON (
      ref.git_repository_id = ${repo.id} AND ref.pr_number = pr.pr_number
    )
    INNER JOIN ${withCherryPickedCommits({
      fields: sql`c.commit_sha`,
      nameWithoutCherryPicked: sql`commits`,
      repositoryID: repo.id,
      filter: releasedCommits.size
        ? sql`c.commit_sha NOT IN ${withCherryPickedCommits({
            fields: sql`c.commit_sha`,
            nameWithoutCherryPicked: sql`excluded_commits`,
            repositoryID: repo.id,
          })}`
        : undefined,
    })} AS c ON (
      pr.merge_commit_sha = c.commit_sha OR
      ref.commit_sha = c.commit_sha
    )
    WHERE change.package_name = ${packageName}
    ORDER BY change.id ASC
  `);
}

export async function isCommitReleased(
  db: Queryable,
  repo: DbGitRepository,
  {
    commitShaToCheck,
    releasedCommits,
  }: {
    commitShaToCheck: string;
    releasedCommits: Set<string>;
  },
): Promise<boolean> {
  const [{result}] = await db.query(sql`
    ${selectCommits({
      repositoryID: repo.id,
      includedCommits: releasedCommits,
      excludedCommits: new Set(),
    })}
    SELECT COUNT(*) as result
    FROM ${withCherryPickedCommits({
      fields: sql`c.commit_sha`,
      nameWithoutCherryPicked: sql`commits`,
      repositoryID: repo.id,
      filter: sql`c.commit_sha = ${commitShaToCheck}`,
    })} AS c
  `);
  return parseInt(`${result}`, 10) === 1;
}
