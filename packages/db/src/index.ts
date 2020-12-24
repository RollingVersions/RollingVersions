import connect, {sql, Queryable} from '@databases/pg';
import createTyped from '@databases/pg-typed';
import DatabaseSchema from './__generated__';

export {sql, Queryable};
const db = connect({
  bigIntMode: 'number',
});
export default db;

export const tables = createTyped<DatabaseSchema>({
  defaultConnection: db,
});
