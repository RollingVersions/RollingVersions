import DatabaseSchema from '@rollingversions/db-schema';
import connect, {sql, Queryable} from '@databases/pg';
import createTyped from '@databases/pg-typed';

export {sql, Queryable};
const db = connect({
  bigIntMode: 'number',
});
export default db;

const {
  git_branches,
  git_commits,
  git_repositories,
  package_dependency_records,
  package_manifest_records,
} = createTyped<DatabaseSchema>({
  defaultConnection: db,
});

export {
  git_branches,
  git_commits,
  git_repositories,
  package_dependency_records,
  package_manifest_records,
};
