import connect, {sql, Connection} from '@databases/pg';
import {ChangeType} from 'rollingversions/lib/types/PullRequestState';
import {Repository} from 'rollingversions/lib/types';

export const db = connect();

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
  {
    repo,
    deployBranch,
  }: {
    repo: Repository;
    deployBranch?: string | null;
  },
): Promise<{name: string; target_git_commit_id: number} | undefined> {
  const result = deployBranch
    ? await db.query(sql`
      SELECT b.name, b.target_git_commit_id
      FROM git_repositories r
      INNER JOIN git_branches b ON (b.git_repository_id = r.id AND b.name = ${deployBranch})
      WHERE r.owner = ${repo.owner} AND r.name = ${repo.name}
    `)
    : await db.query(sql`
      SELECT t.name, t.target_git_commit_id
      FROM git_repositories r
      INNER JOIN git_branches b ON (b.git_repository_id = r.id AND b.name = r.default_branch_name)
      WHERE r.owner = ${repo.owner} AND r.name = ${repo.name}
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
