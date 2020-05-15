import connect, {sql, Connection} from '@databases/pg';
import {ChangeType} from 'rollingversions/lib/types/PullRequestState';
import {Repository} from 'rollingversions/lib/types';

export {Connection};
export const db = connect();

// CREATE TABLE git_repositories (
//   id INT NOT NULL PRIMARY KEY,
//   graphql_id TEXT NOT NULL,
//   owner TEXT NOT NULL,
//   name TEXT NOT NULL,
//   default_branch_name TEXT NOT NULL
// );

export async function upsertRepository(
  db: Connection,
  repo: {
    id: number;
    graphql_id: string;
    owner: string;
    name: string;
    default_branch_name: string;
  },
) {
  await db.query(sql`
    INSERT INTO git_repositories (id, graphql_id, owner, name, default_branch_name)
    VALUES (${repo.id}, ${repo.graphql_id}, ${repo.owner}, ${repo.name}, ${repo.default_branch_name})
    ON CONFLICT (id) DO UPDATE
    SET graphql_id=EXCLUDED.graphql_id, owner=EXCLUDED.owner, name=EXCLUDED.name, default_branch_name=EXCLUDED.default_branch_name
  `);
}

export async function filterOutExisingPullRequestIDs<T extends {id: number}>(
  db: Connection,
  git_repository_id: number,
  pullRequests: readonly T[],
) {
  const existingPullRequestIDs = new Set<number>(
    (
      await db.query(
        sql`
          SELECT id FROM pull_requests
          WHERE git_repository_id = ${git_repository_id}
          AND id = ANY(${pullRequests.map(({id}) => id)})
        `,
      )
    ).map((pr) => pr.id),
  );
  return pullRequests.filter(({id}) => !existingPullRequestIDs.has(id));
}
export async function filterToExistingCommitShas(
  db: Connection,
  git_repository_id: number,
  commit_shas: readonly string[],
) {
  return new Set<string>(
    (
      await db.query(
        sql`
          SELECT commit_sha FROM git_commits
          WHERE git_repository_id = ${git_repository_id}
          AND commit_sha = ANY(${commit_shas})
        `,
      )
    ).map((c) => c.commit_sha),
  );
}

export async function upsertCommits(
  db: Connection,
  git_repository_id: number,
  commits: {
    graphql_id: string;
    commit_sha: string;
    parents: string[];
    associatedPullRequests: {id: number}[];
  }[],
) {
  const existingCommits = new Set<string>(
    (
      await db.query(
        sql`
          SELECT commit_sha FROM git_commits
          WHERE git_repository_id = ${git_repository_id}
          AND commit_sha = ANY(${commits.map((c) => c.commit_sha)})
        `,
      )
    ).map((c) => c.commit_sha),
  );
  const allShas = [
    ...new Set([
      ...commits.map((c) => c.commit_sha),
      ...commits.flatMap((c) => c.parents),
    ]),
  ];
  await db.tx(async (tx) => {
    const newCommits = commits.filter(
      (c) => !existingCommits.has(c.commit_sha),
    );
    if (newCommits.length) {
      await tx.query(sql`
        INSERT INTO git_commits (graphql_id, git_repository_id, commit_sha, has_package_info)
        VALUES ${sql.join(
          newCommits.map(
            (c) =>
              sql`(${c.graphql_id}, ${git_repository_id}, ${c.commit_sha}, false)`,
          ),
          ',',
        )}
        ON CONFLICT (git_repository_id, commit_sha) DO NOTHING
      `);
    }
    const commitIDs = new Map<string, number>(
      (
        await tx.query(
          sql`
            SELECT id, commit_sha FROM git_commits
            WHERE git_repository_id = ${git_repository_id}
            AND commit_sha = ANY(${allShas})
          `,
        )
      ).map((c) => [c.commit_sha, c.id]),
    );
    const missingShas = allShas.filter((sha) => !commitIDs.has(sha));
    if (missingShas.length) {
      throw new Error('Missing commit IDs for: ' + JSON.stringify(missingShas));
    }
    const parents = commits.flatMap((c) =>
      c.parents.map((p) => {
        const child_git_commit_id = commitIDs.get(c.commit_sha);
        const parent_git_commit_id = commitIDs.get(p);
        if (!child_git_commit_id) {
          throw new Error(`Could not find the child commit ${c.commit_sha}`);
        }
        if (!parent_git_commit_id) {
          throw new Error(`Could not find the parent commit ${p}`);
        }
        return {child_git_commit_id, parent_git_commit_id};
      }),
    );
    if (parents.length) {
      await tx.query(sql`
        INSERT INTO git_commit_parents (child_git_commit_id, parent_git_commit_id)
        VALUES ${sql.join(
          parents.map(
            (cp) =>
              sql`(${cp.child_git_commit_id}, ${cp.parent_git_commit_id})`,
          ),
          ',',
        )}
        ON CONFLICT (child_git_commit_id, parent_git_commit_id) DO NOTHING
      `);
    }
    const associatedPullRequests = commits.flatMap((c) =>
      c.associatedPullRequests.map((p) => {
        const git_commit_id = commitIDs.get(c.commit_sha);
        if (!git_commit_id) {
          throw new Error(`Could not find the commit ${c.commit_sha}`);
        }
        return {git_commit_id, pull_request_id: p.id};
      }),
    );
    if (associatedPullRequests.length) {
      // N.B. this can fail if the pull request records have not yet been created
      await tx.query(sql`
        INSERT INTO git_commit_pull_requests (git_commit_id, pull_request_id)
        VALUES ${sql.join(
          associatedPullRequests.map(
            (ap) => sql`(${ap.git_commit_id}, ${ap.pull_request_id})`,
          ),
          ',',
        )}
        ON CONFLICT (git_commit_id, pull_request_id) DO NOTHING
      `);
    }
  });
}

export async function getPullRequestExists(
  db: Connection,
  git_repository_id: number,
  pullRequestId: number,
) {
  const results = await db.query(
    sql`
      SELECT id FROM pull_requests
      WHERE git_repository_id=${git_repository_id} AND id=${pullRequestId}
    `,
  );
  return results.length === 1;
}

export async function insertPullRequest(
  db: Connection,
  git_repository_id: number,
  pr: {
    id: number;
    graphql_id: string;
    number: number;
    title: string;
    is_merged: boolean;
    is_closed: boolean;
  },
) {
  await db.query(
    sql`
      INSERT INTO pull_requests (id, graphql_id, git_repository_id, pr_number, title, is_merged, is_closed)
      VALUES (${pr.id}, ${pr.graphql_id}, ${git_repository_id}, ${pr.number}, ${pr.title}, ${pr.is_merged}, ${pr.is_closed})
    `,
  );
}
export async function updatePullRequest(
  db: Connection,
  git_repository_id: number,
  pr: {
    id: number;
    title: string;
    is_merged: boolean;
    is_closed: boolean;
  },
) {
  await db.query(
    sql`
      UPDATE pull_requests
      SET title=${pr.title}, is_merged=${pr.is_merged}, is_closed=${pr.is_closed}
      WHERE git_repository_id=${git_repository_id} AND id=${pr.id}
    `,
  );
}
export async function setPullRequestSubmittedAtSha(
  db: Connection,
  git_repository_id: number,
  prId: number,
  change_set_submitted_at_git_commit_sha: string | null,
) {
  await db.query(
    sql`
      UPDATE pull_requests
      SET change_set_submitted_at_git_commit_sha=${change_set_submitted_at_git_commit_sha}
      WHERE git_repository_id=${git_repository_id} AND id=${prId}
    `,
  );
}

export async function getCommitIdFromSha(
  db: Connection,
  git_repository_id: number,
  commit_sha: string,
) {
  const results = await db.query(
    sql`
      SELECT id FROM git_commits
      WHERE git_repository_id = ${git_repository_id}
      AND commit_sha = ${commit_sha}
    `,
  );
  if (results.length === 0) {
    return null;
  }
  if (results.length > 1) {
    throw new Error('Multiple commits should not have the same sha');
  }
  return results[0].id as number;
}

export async function insertChangeLogEntries(
  db: Connection,
  pull_request_id: number,
  entries: {
    sort_order_weight: number;
    package_name: string;
    kind: 'breaking' | 'feat' | 'refactor' | 'perf' | 'fix';
    title: string;
    body: string;
  }[],
) {
  if (!entries.length) return;
  await db.query(sql`
    INSERT INTO change_log_entries (pull_request_id, package_name, sort_order_weight, kind, title, body)
    VALUES ${sql.join(
      entries.map(
        (e) =>
          sql`(${pull_request_id}, ${e.package_name}, ${e.sort_order_weight}, ${e.kind}, ${e.title}, ${e.body})`,
      ),
      ',',
    )};
  `);
}

export async function getAllUnreleasedChanges(
  db: Connection,
  {
    headCommitID,
    lastReleaseCommitID,
    packageName,
  }: {headCommitID: number; lastReleaseCommitID: number; packageName: string},
): Promise<
  {
    pr_number: number;
    id: number;
    sort_order_weight: number;
    kind: ChangeType;
    title: string;
    body: string;
  }[]
> {
  return await db.query(sql`
    WITH RECURSIVE
      commits_to_exclude AS (
        SELECT c.id
        FROM git_commits c
        WHERE c.id = ${lastReleaseCommitID}
        UNION
        SELECT c.id
        FROM git_commits c
        INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
        INNER JOIN commits_to_exclude ON (cp.child_git_commit_id = commits_to_exclude.id)
      ),
      commits AS (
        SELECT c.*
        FROM git_commits c
        WHERE c.id = ${headCommitID}
        AND c.id NOT IN (select id FROM commits_to_exclude)
        UNION
        SELECT c.*
        FROM git_commits c
        INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
        INNER JOIN commits ON (cp.child_git_commit_id = commits.id)
        WHERE c.id NOT IN (select id FROM commits_to_exclude)
      )
    SELECT DISTINCT pr.pr_number, cl.id, cl.sort_order_weight, cl.kind, cl.title, cl.body
    FROM commits c
    INNER JOIN git_commit_pull_requests cp ON (cp.git_commit_id = c.id)
    INNER JOIN pull_requests pr ON (cp.pull_request_id = pr.id)
    INNER JOIN change_log_entries cl ON (cl.pull_request_id = pr.id)
    WHERE cl.package_name = ${packageName}
    ORDER BY cl.sort_order_weight, cl.id ASC
  `);
}

export async function getAllTags(
  db: Connection,
  repo: Repository,
): Promise<{name: string; target_git_commit_id: number}[]> {
  return await db.query(sql`
    SELECT t.name, t.target_git_commit_id
    FROM git_repositories r
    INNER JOIN git_tags t ON (t.git_repository_id = r.id)
    WHERE r.owner = ${repo.owner} AND r.name = ${repo.name}
  `);
}

export async function getBranch(
  db: Connection,
  git_repository_id: number,
  branchName: string,
): Promise<{name: string; target_git_commit_id: number} | undefined> {
  const result = await db.query(sql`
    SELECT name, target_git_commit_id
    FROM git_branches
    WHERE git_repository_id=${git_repository_id} AND name=${branchName}
  `);
  if (result.length > 1) {
    throw new Error(
      'Found multiple git branches with the same name in the same repository',
    );
  }
  if (result.length === 1) {
    return result[0];
  } else {
    return undefined;
  }
}

export async function writeBranch(
  db: Connection,
  git_repository_id: number,
  branch: {graphql_id: string; name: string; target_git_commit_id: number},
  oldTargetGitCommitID: number | null,
): Promise<void> {
  if (oldTargetGitCommitID !== null) {
    await db.query(sql`
      UPDATE git_branches
      SET target_git_commit_id=${branch.target_git_commit_id}
      WHERE git_repository_id=${git_repository_id}
      AND name=${branch.name}
      AND target_git_commit_id=${oldTargetGitCommitID}
    `);
  } else {
    await db.query(sql`
      INSERT INTO git_branches (graphql_id, git_repository_id, name, target_git_commit_id)
      VALUES (${branch.graphql_id}, ${git_repository_id}, ${branch.name}, ${branch.target_git_commit_id})
      ON CONFLICT (git_repository_id, name) DO NOTHING
    `);
  }
}
export async function deleteBranch(
  db: Connection,
  git_repository_id: number,
  branchName: string,
): Promise<void> {
  await db.query(sql`
    DELETE FROM git_branches
    WHERE git_repository_id=${git_repository_id} AND name=${branchName}
  `);
}

export async function upsertTag(
  db: Connection,
  git_repository_id: number,
  tag: {graphql_id: string; name: string; target_git_commit_id: number},
): Promise<void> {
  await db.query(sql`
    INSERT INTO git_tags (graphql_id, git_repository_id, name, target_git_commit_id)
    VALUES (${tag.graphql_id}, ${git_repository_id}, ${tag.name}, ${tag.target_git_commit_id})
    ON CONFLICT (git_repository_id, name) DO UPDATE
    SET target_git_commit_id=EXCLUDED.target_git_commit_id
  `);
}

export async function deleteTag(
  db: Connection,
  git_repository_id: number,
  tagName: string,
): Promise<void> {
  await db.query(sql`
    DELETE FROM git_tags
    WHERE git_repository_id=${git_repository_id} AND name=${tagName}
  `);
}
