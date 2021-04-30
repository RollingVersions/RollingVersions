import connect, {sql, Queryable, SQLQuery} from '@databases/pg';
import createTyped, {anyOf} from '@databases/pg-typed';

import type DatabaseSchema from './__generated__';
import {serializeValue} from './__generated__';

export type {SQLQuery};

export const q = {anyOf};
export {sql, Queryable};
const db = connect({
  bigIntMode: 'number',
});
export default db;

export const tables = createTyped<DatabaseSchema>({
  defaultConnection: db,
  serializeValue,
});
