const {default: connect, sql} = require('@databases/pg');
const pg = connect();

Promise.resolve(null)
  .then(async () => {
    console.log(
      await pg.query(sql`
        INSERT INTO git_repositories (id, graphql_id, owner, name, default_branch_name)
        VALUES (1, 'a', 'me', 'my-repo', 'master')
      `),
    );
    console.log(
      await pg.query(sql`
        SELECT * FROM git_repositories;
      `),
    );
    console.log(
      await pg.query(sql`
        UPDATE git_repositories SET name='new-name' WHERE id=1 RETURNING id
      `),
    );
    console.log(
      await pg.query(sql`
        UPDATE git_repositories SET name='new-name' WHERE id=2 RETURNING id
      `),
    );
    console.log(
      await pg.query(sql`
        SELECT * FROM git_repositories;
      `),
    );
  })
  .then(
    async () => {
      await pg.dispose().catch(() => {});
      process.exit(0);
    },
    async (ex) => {
      await pg.dispose().catch(() => {});
      console.error(ex.stack);
      process.exit(1);
    },
  );
// id INT NOT NULL PRIMARY KEY,
// graphql_id TEXT NOT NULL,
// owner TEXT NOT NULL,
// name TEXT NOT NULL,
// default_branch_name TEXT NOT NULL
