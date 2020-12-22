const {default: connect, sql} = require('@databases/pg');
const interrogator = require('interrogator');

console.log('Starting');

(async () => {
  let DATABASE_URL = process.env.DATABASE_URL;
  if (DATABASE_URL) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } else {
    DATABASE_URL = await interrogator.input(
      'Please enter a connection string:',
    );
  }
  const db = connect(DATABASE_URL);
  try {
    [
      ...new Set(
        (
          await db.query(sql`
          WITH
            a AS (SELECT * FROM git_commits WHERE git_repository_id = 734934 OR git_repository_id = 7296439),
            b AS (SELECT * FROM git_commits WHERE git_repository_id = 46021435 OR git_repository_id = 7296439)
          SELECT a.* FROM a LEFT OUTER JOIN b ON a.id = b.id WHERE b.id IS NULL
          UNION SELECT b.* FROM b LEFT OUTER JOIN a ON a.id = b.id WHERE a.id IS NULL;
        `)
        ).map((v) => v.git_repository_id),
      ),
    ]
      .sort()
      .forEach((v) => console.log(v));

    console.log('v2');
    [
      ...new Set(
        (
          await db.query(sql`
            WITH
              a AS (SELECT * FROM git_commits WHERE git_repository_id = 734934 OR git_repository_id = 7296439),
              b AS (SELECT * FROM git_commits WHERE git_repository_id = 46021435 OR git_repository_id = 7296439),
              diff AS (
                SELECT a.* FROM a LEFT OUTER JOIN b ON a.id = b.id WHERE b.id IS NULL
                UNION SELECT b.* FROM b LEFT OUTER JOIN a ON a.id = b.id WHERE a.id IS NULL
              )
            SELECT * FROM diff;
          `)
        ).map((v) => v.git_repository_id),
      ),
    ]
      .sort()
      .forEach((v) => console.log(v));
  } finally {
    await db.dispose();
  }
})().catch((err) => {
  console.error(err.stack);
  process.exit(1);
});
