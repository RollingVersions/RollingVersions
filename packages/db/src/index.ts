import connect, {sql, Queryable, SQLQuery} from '@databases/pg';
import createTyped, {anyOf, greaterThan} from '@databases/pg-typed';

import type DatabaseSchema from './__generated__';
import {serializeValue} from './__generated__';

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
export const q = {anyOf, greaterThan};
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
  onQueryStart(_query, {text}) {
    logger?.info(`query_start`, text);
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
  serializeValue,
});
