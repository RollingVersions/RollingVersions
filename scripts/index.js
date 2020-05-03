const {readdirSync} = require('fs');
const {default: connect, sql} = require('@databases/pg');

console.log('Starting');

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const db = connect();
  try {
    await db.tx(async (tx) => {
      debugger;
      await tx.query(
        sql`CREATE TABLE IF NOT EXISTS db_migrations_applied (migration_name TEXT NOT NULL PRIMARY KEY)`,
      );
    });

    const alreadyRun = new Set(
      (
        await db.query(sql`SELECT migration_name FROM db_migrations_applied`)
      ).map((r) => r.migration_name),
    );
    for (const migrationName of readdirSync(
      `${__dirname}/../db-migrations`,
    ).sort()) {
      if (!/\.sql$/.test(migrationName)) continue;
      if (alreadyRun.has(migrationName)) continue;
      await db.tx(async (tx) => {
        await tx.query([
          sql.file(`${__dirname}/../db-migrations/${migrationName}`),
        ]);
        await tx.query(
          sql`INSERT INTO db_migrations_applied (migration_name) VALUES (${migrationName})`,
        );
      });
    }

    console.log(
      await db.query(sql`
        SELECT * FROM git_repositories
      `),
    );
    console.log(
      'all parents of commit 1 (including commit 1 itself)',
      await db.query(sql`
        WITH RECURSIVE commits AS (
          SELECT c.*
          FROM git_commits c
          WHERE c.id = ${1}
          UNION
          SELECT c.*
          FROM git_commits c
          INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
          INNER JOIN commits ON (cp.child_git_commit_id = commits.id)
        )
        SELECT * FROM commits
      `),
    );
    console.log(
      'all parents of commit 1 (including commit 1 itself) excluding parents of commit 2',
      await db.query(sql`
        WITH RECURSIVE
          commits_to_exclude AS (
            SELECT c.id
            FROM git_commits c
            WHERE c.id = ${2}
            UNION
            SELECT c.id
            FROM git_commits c
            INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
            INNER JOIN commits_to_exclude ON (cp.child_git_commit_id = commits_to_exclude.id)
          ),
          commits AS (
            SELECT c.*
            FROM git_commits c
            WHERE c.id = ${1}
            AND c.id NOT IN (select id FROM commits_to_exclude)
            UNION
            SELECT c.*
            FROM git_commits c
            INNER JOIN git_commit_parents cp ON (cp.parent_git_commit_id = c.id)
            INNER JOIN commits ON (cp.child_git_commit_id = commits.id)
            WHERE c.id NOT IN (select id FROM commits_to_exclude)
          )
        SELECT * FROM commits
      `),
    );
  } finally {
    await db.dispose();
  }
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
