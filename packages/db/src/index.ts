import connect, {
  sql,
  Queryable,
  ConnectionPool,
  Connection,
  Transaction,
} from '@databases/pg';
import createTyped, {
  anyOf,
  not,
  lessThan,
  greaterThan,
  inQueryResults,
} from '@databases/pg-typed';
import DatabaseSchema, {serializeValue} from './__generated__';

export type {Queryable, ConnectionPool, Connection, Transaction};

export const q = {anyOf, not, lessThan, greaterThan, inQueryResults};
export {sql};

const db = connect({
  bigIntMode: 'number',
});
export default db;

export type {DatabaseSchema};
export const tables = createTyped<DatabaseSchema>({
  defaultConnection: db,
  serializeValue,
});
const {
  git_branches,
  git_commits,
  git_commit_parent_cursors,
  git_commit_parent_shas,
  git_commit_parents,
  git_commit_pull_requests,
  git_repositories,
  package_dependency_records,
  package_manifest_records,
  pull_requests,
} = tables;
export {
  git_branches,
  git_commits,
  git_commit_parent_cursors,
  git_commit_parent_shas,
  git_commit_parents,
  git_commit_pull_requests,
  git_repositories,
  package_dependency_records,
  package_manifest_records,
  pull_requests,
};
