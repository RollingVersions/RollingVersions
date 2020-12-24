import {Table} from '@databases/pg-typed';
import TransactionOptions from '@databases/pg/lib/types/TransactionOptions';
import GitHubClient from '@github-graph/api';
import database, {
  tables,
  Queryable,
  DatabaseSchema,
  Transaction,
  ConnectionPool,
  Connection,
} from '@rollingversions/db';
import {Repository} from 'rollingversions/src/types';
import {Request, Response} from 'express';
import isObject from '../utils/isObject';
import getClient, {getClientForRepo} from './getClient';
import logger, {expressLogger, Logger} from './logger';
import {User} from './middleware/utils/checkPermissions';

const cachedTables: any = {};
function getTable(tableName: string) {
  return (
    cachedTables[tableName] ||
    (cachedTables[tableName] = (tables as any)[tableName])
  );
}

interface ServerContextBase<TConnection> {
  readonly escapeTransaction: () => NonTransactionContext;
  readonly db: TConnection;
  tx<T>(
    fn: (context: ServerContext<Transaction>) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;
  getGitHubClient(): Promise<GitHubClient>;
  withContext(context: {[key: string]: unknown}): ServerContext<TConnection>;
  withLogging: Logger['withLogging'];
  info: Logger['info'];
  warning: Logger['warning'];
  error: Logger['error'];
  startTimer: Logger['withTimer'];
  throw: (
    code: string,
    message: string,
    context?: {[key: string]: unknown},
  ) => never;
}
type ServerContextTables = {
  [TTableName in keyof DatabaseSchema]: Table<
    DatabaseSchema[TTableName]['record'],
    DatabaseSchema[TTableName]['insert']
  >;
};

type ServerContext<TConnection = Queryable> = ServerContextBase<TConnection> &
  ServerContextTables;

export default ServerContext;
export type NonTransactionContext = ServerContext<ConnectionPool | Connection>;
export type TransactionContext = ServerContext<Transaction>;

export function createServerContext<TConnection extends Queryable>(
  pool: ConnectionPool,
  connection: TConnection,
  getGitHubClient: () => Promise<GitHubClient>,
  logger: Logger,
): ServerContext<TConnection> {
  const target: ServerContextBase<TConnection> = {
    // Database
    escapeTransaction: () =>
      createServerContext(pool, pool, getGitHubClient, logger),
    db: connection,
    async tx(fn, options) {
      return connection.tx(
        (transaction) =>
          fn(createServerContext(pool, transaction, getGitHubClient, logger)),
        options,
      );
    },

    // GitHub

    getGitHubClient,

    // logging

    withContext(ctx) {
      return createServerContext(
        pool,
        connection,
        getGitHubClient,
        logger.withContext(ctx),
      );
    },
    withLogging: (...args) => logger.withLogging(...args),
    info: (...args) => logger.info(...args),
    warning: (...args) => logger.warning(...args),
    error: (...args) => logger.error(...args),

    startTimer: (...args) => logger.withTimer(...args),

    throw: (...args) => logger.throw(...args),
  };

  return new Proxy(target as any, {
    get: (target, prop, _receiver) => {
      if (prop in target) {
        return target[prop];
      }
      const tableName = String(prop);
      return getTable(tableName)(connection);
    },
  });
}

export function createServerContextForEvent({
  id,
  name,
  payload,
}: {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
}): ServerContext<ConnectionPool> {
  if (!isObject(payload)) {
    throw new Error(`Invalid event payload: ${JSON.stringify(payload)}`);
  }

  let l = logger.withTransaction({
    txid: id,
    event_name: name,
    ...(typeof payload.action === 'string'
      ? {event_action: payload.action}
      : {}),
  });
  if (
    isObject(payload.repository) &&
    isObject(payload.repository.owner) &&
    typeof payload.repository.owner.login === 'string' &&
    typeof payload.repository.name === 'string'
  ) {
    l = l.withContext({
      repo_owner: payload.repository.owner.login,
      repo_name: payload.repository.name,
    });
  } else if (
    isObject(payload.installation) &&
    isObject(payload.installation.account) &&
    typeof payload.installation.account.login === 'string'
  ) {
    l = l.withContext({
      repo_owner: payload.installation.account.login,
    });
  }

  if (name === 'installation' && payload.action === 'deleted') {
    return createServerContext(
      database,
      database,
      memoize(async () => getClient()),
      l,
    );
  }

  if (
    isObject(payload.installation) &&
    typeof payload.installation.id === 'number'
  ) {
    const installationID = payload.installation.id;
    return createServerContext(
      database,
      database,
      memoize(async () => getClient(installationID)),
      l,
    );
  }

  throw new Error(
    `Invalid event payload.installation: ${JSON.stringify(
      payload.installation,
    )}`,
  );
}

export function createServerContextForRequest(
  req: Request,
  res: Response,
  {
    repo,
    pr_number,
    user,
  }: {
    readonly repo: Repository;
    readonly pr_number: number | null;
    readonly user: User;
  },
): ServerContext<ConnectionPool> {
  const l = expressLogger(req, res).withContext({
    repo_owner: repo.owner,
    repo_name: repo.name,
    ...(pr_number !== null ? {pr_number} : {}),
    user_login: user.login,
  });

  return createServerContext(
    database,
    database,
    memoize(async () => getClientForRepo(repo)),
    l,
  );
}

function memoize<TResult>(fn: () => TResult): () => TResult {
  let result: null | {value: TResult} = null;
  return () => {
    if (result) {
      return result.value;
    }
    const value = fn();
    result = {value};
    return value;
  };
}
