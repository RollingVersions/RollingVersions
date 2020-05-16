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
  } finally {
    await db.dispose();
  }
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
