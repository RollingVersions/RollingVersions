import connect, {sql, Connection} from '@databases/pg';
import {ChangeType} from 'rollingversions/lib/types/PullRequestState';
import {PublishTarget} from 'rollingversions/lib/types';

export {Connection};
export const db = connect();

export async function getRepository(
  db: Connection,
  repo: {
    owner: string;
    name: string;
  },
): Promise<null | {
  id: number;
  graphql_id: string;
  owner: string;
  name: string;
  default_branch_name: string;
  target_git_commit_id: number | null;
  target_commit_graphql_id: string | null;
  commit_sha: string | null;
}> {
  const results = await db.query(sql`
    SELECT r.id, r.graphql_id, r.owner, r.name, r.default_branch_name, b.target_git_commit_id, c.commit_sha, c.graphql_id AS target_commit_graphql_id
    FROM git_repositories r
    LEFT OUTER JOIN git_branches b ON (b.git_repository_id=r.id AND b.name=r.default_branch_name)
    LEFT OUTER JOIN git_commits c ON (b.target_git_commit_id=c.id)
    WHERE r.owner=${repo.owner} AND r.name=${repo.name}
  `);
  return results[0] || null;
}

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
        INSERT INTO git_commits (graphql_id, git_repository_id, commit_sha, has_package_manifests)
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

export async function getPullRequestCommentID(
  db: Connection,
  git_repository_id: number,
  pullRequestId: number,
): Promise<{commentID: number | null} | null> {
  const results = await db.query(
    sql`
      SELECT comment_id FROM pull_requests
      WHERE git_repository_id=${git_repository_id} AND id=${pullRequestId}
    `,
  );
  return results.length === 1 ? {commentID: results[0].comment_id} : null;
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
    comment_id: number | null;
  },
) {
  await db.query(
    sql`
      INSERT INTO pull_requests (id, graphql_id, git_repository_id, pr_number, title, is_merged, is_closed, comment_id)
      VALUES (${pr.id}, ${pr.graphql_id}, ${git_repository_id}, ${pr.number}, ${pr.title}, ${pr.is_merged}, ${pr.is_closed}, ${pr.comment_id})
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
export async function updatePullRequestCommentID(
  db: Connection,
  git_repository_id: number,
  pr: {
    id: number;
    comment_id: number;
  },
) {
  await db.query(
    sql`
      UPDATE pull_requests
      SET comment_id=${pr.comment_id}
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

export async function updateChangeLogEntries(
  db: Connection,
  git_repository_id: number,
  pull_request_id: number,
  change_set_submitted_at_git_commit_sha: string | null,
  entries: {
    sort_order_weight: number;
    package_name: string;
    kind: 'breaking' | 'feat' | 'refactor' | 'perf' | 'fix';
    title: string;
    body: string;
  }[],
) {
  await db.tx(async (tx) => {
    await tx.query(
      sql`DELETE FROM change_log_entries WHERE pull_request_id=${pull_request_id}`,
    );
    // TODO(feat): support replacing specific entries, rather than deleting and starting again on every write
    if (entries.length) {
      await tx.query(sql`
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
    await setPullRequestSubmittedAtSha(
      tx,
      git_repository_id,
      pull_request_id,
      change_set_submitted_at_git_commit_sha,
    );
  });
}
export async function getAllTags(
  db: Connection,
  git_repository_id: number,
): Promise<
  {
    id: number;
    graphql_id: string;
    name: string;
    target_git_commit_id: number;
    commit_sha: string;
  }[]
> {
  return await db.query(sql`
    SELECT gt.id, gt.graphql_id, gt.name, gt.target_git_commit_id, gc.commit_sha
    FROM git_tags gt
    INNER JOIN git_commits gc ON (gt.target_git_commit_id = gc.id)
    WHERE gt.git_repository_id = ${git_repository_id}
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
): Promise<{
  id: number;
  graphql_id: string;
  name: string;
  target_git_commit_id: number;
}> {
  const upserted = await db.query(sql`
    INSERT INTO git_tags (graphql_id, git_repository_id, name, target_git_commit_id)
    VALUES (${tag.graphql_id}, ${git_repository_id}, ${tag.name}, ${tag.target_git_commit_id})
    ON CONFLICT (git_repository_id, name) DO UPDATE
    SET target_git_commit_id=EXCLUDED.target_git_commit_id
    RETURNING id
  `);
  return {
    id: upserted[0].id,
    ...tag,
  };
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

export async function getChangesForPullRequest(
  db: Connection,
  pullRequsetID: number,
): Promise<
  {
    id: number;
    package_name: string;
    sort_order_weight: number;
    kind: ChangeType;
    title: string;
    body: string;
  }[]
> {
  return await db.query(sql`
    SELECT cl.id, cl.package_name, cl.sort_order_weight, cl.kind, cl.title, cl.body
    FROM change_log_entries cl
    WHERE cl.pull_request_id = ${pullRequsetID}
    ORDER BY cl.sort_order_weight, cl.id ASC
  `);
}

export async function getPackageManifests(
  db: Connection,
  git_commit_id: number,
) {
  return await db.tx(async (tx) => {
    const commit = await tx.query(
      sql`SELECT has_package_manifests FROM git_commits WHERE id=${git_commit_id}`,
    );
    if (commit.length !== 1) {
      throw new Error('Could not find the requested commit');
    }
    if (!commit[0].has_package_manifests) {
      return undefined;
    }
    const [packageManifests, dependencies]: [
      {
        file_path: string;
        publish_target: PublishTarget;
        package_name: string;
        publish_access: 'restricted' | 'public';
        not_to_be_published: boolean;
      }[],
      {
        package_name: string;
        kind: 'required' | 'optional' | 'development';
        dependency_name: string;
      }[],
    ] = await Promise.all([
      tx.query(sql`
        SELECT file_path, publish_target, package_name, publish_access, not_to_be_published
        FROM package_manifest_records
        WHERE git_commit_id=${git_commit_id}
      `),
      tx.query(sql`
        SELECT package_name, kind, dependency_name
        FROM package_dependency_records
        WHERE git_commit_id=${git_commit_id}
      `),
    ]);
    return {packageManifests, dependencies};
  });
}

const parallelUpdateError = new Error('Aborting due to parallel updates');
export async function writePackageManifest(
  db: Connection,
  git_commit_id: number,
  packages: {
    file_path: string;
    publish_target: PublishTarget;
    package_name: string;
    publish_access: 'restricted' | 'public';
    not_to_be_published: boolean;
  }[],
  dependencies: {
    package_name: string;
    kind: 'required' | 'optional' | 'development';
    dependency_name: string;
  }[],
) {
  try {
    await db.tx(async (tx) => {
      if (packages.length) {
        await tx.query(sql`
          INSERT INTO package_manifest_records (git_commit_id, file_path, publish_target, package_name, publish_access, not_to_be_published)
          VALUES ${sql.join(
            packages.map(
              (p) =>
                sql`(${git_commit_id}, ${p.file_path}, ${p.publish_target}, ${p.package_name}, ${p.publish_access}, ${p.not_to_be_published})`,
            ),
            ',',
          )}
          ON CONFLICT DO NOTHING
        `);
      }
      if (dependencies.length) {
        await tx.query(sql`
          INSERT INTO package_dependency_records (git_commit_id, package_name, kind, dependency_name)
          VALUES ${sql.join(
            dependencies.map(
              (d) =>
                sql`(${git_commit_id}, ${d.package_name}, ${d.kind}, ${d.dependency_name})`,
            ),
            ',',
          )}
          ON CONFLICT DO NOTHING
        `);
      }
      const updates = await tx.query(sql`
        UPDATE git_commits
        SET has_package_manifests=true
        WHERE id=${git_commit_id} AND has_package_manifests=false
        RETURNING id
      `);
      if (updates.length !== 1) {
        throw parallelUpdateError;
      }
    });
    return true;
  } catch (ex) {
    if (ex !== parallelUpdateError) {
      throw ex;
    }
    return false;
  }
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

export async function isPullRequestReleased(
  db: Connection,
  {
    releasedCommitIDs,
    pullRequestID,
  }: {releasedCommitIDs: Set<number>; pullRequestID: number},
): Promise<boolean> {
  if (!releasedCommitIDs.size) return false;
  const released = await db.query(sql`
    WITH RECURSIVE
      released_commits AS (
        SELECT c.id
        FROM git_commits c
        WHERE c.id = ANY(${[...releasedCommitIDs]})
        UNION
        SELECT c.id
        FROM git_commits c
        INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
        INNER JOIN released_commits ON (cp.child_git_commit_id = released_commits.id)
      )
    SELECT DISTINCT cp.pull_request_id
    FROM released_commits c
    INNER JOIN git_commit_pull_requests cp ON (cp.git_commit_id = c.id)
    WHERE cp.pull_request_id = ${pullRequestID}
  `);
  return released.length !== 0;
}
