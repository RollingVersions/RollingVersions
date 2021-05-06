import connect, {sql, Queryable, SQLQuery} from '@databases/pg';
import createTyped, {anyOf} from '@databases/pg-typed';

import type DatabaseSchema from './__generated__';
import {serializeValue} from './__generated__';

export type {Queryable, SQLQuery};

export const q = {anyOf};
export {sql};
const db = connect({
  bigIntMode: 'number',
});
export default db;

export const tables = createTyped<DatabaseSchema>({
  defaultConnection: db,
  serializeValue,
});
