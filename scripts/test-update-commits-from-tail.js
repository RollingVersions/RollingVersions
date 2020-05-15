process.env.DATABASE_URL = 'postgres://test-user@localhost:5433/test-db';
const addRepository = require('../packages/server/lib/server/db-update-jobs/procedures/addRepository')
  .default;

const db = require('../packages/server/lib/server/services/postgres').db;

const {default: GitHubClient, auth} = require('@github-graph/api');
const sql = require('@databases/pg').sql;

updateCommitsFromTail(
  db,
  new GitHubClient({
    auth: auth.createTokenAuth(process.env.GITHUB_TOKEN),
  }),
  // {owner: 'ForbesLindesay', name: 'atdatabases'},
  {owner: 'pugjs', name: 'pug'},
)
  // Promise.resolve(null)
  // .then(async () => {
  //   console.log(
  //     await db.query(sql`
  //       SELECT * FROM git_commits
  //     `),
  //   );
  // })
  .then(
    () => db.dispose(),
    async (ex) => {
      console.error(ex.stack);
      try {
        await db.dispose();
      } catch (ex) {}
      process.exit(1);
    },
  );
