import {readFileSync} from 'fs';

import connect, {sql, Queryable, SQLQuery} from '@databases/pg';
import createTyped, {anyOf, greaterThan, not} from '@databases/pg-typed';

import type DatabaseSchema from './__generated__/_DatabaseSchema';

export * from './__generated__';
export type {Queryable, SQLQuery};

export type LogMethod = (
  event_type: string,
  message: string,
  context?: {
    [key: string]: unknown;
  },
) => void;
export interface Logger {
  readonly debug: LogMethod;
  readonly info: LogMethod;
  readonly notice: LogMethod;
  readonly warning: LogMethod;
  readonly error: LogMethod;
  readonly crit: LogMethod;
  readonly alert: LogMethod;
  readonly emerg: LogMethod;
}
let logger: Logger | undefined;
export function setDatabaseLogger(l: Logger) {
  logger = l;
}
export const q = {anyOf, greaterThan, not};
export {sql};
const db = connect({
  bigIntMode: 'number',
  onConnectionOpened() {
    logger?.info(`connection_opened`, `Postgres connection opened`);
  },
  onConnectionClosed() {
    logger?.info(`connection_opened`, `Postgres connection opened`);
  },
  onError(err) {
    logger?.error(`db_error`, err.stack ?? err.message);
  },
  onQueryStart(_query, {text, values}) {
    logger?.info(`query_start`, text, {values});
  },
  onQueryResults(_query, {text}, results) {
    logger?.info(`query_end`, text, {count: results.length});
  },
  onQueryError(_query, _, err) {
    logger?.error(`query_fail`, err.message);
  },
});
export default db;

export const tables = createTyped<DatabaseSchema>({
  defaultConnection: db,
  databaseSchema: JSON.parse(
    readFileSync(
      process.env.DATABASE_SCHEMA_JSON ??
        `${__dirname}/__generated__/schema.json`,
      `utf8`,
    ),
  ),
});
