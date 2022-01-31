import cuid from 'cuid';
import type {Request, Response, NextFunction} from 'express';
import onFinished from 'on-finished';
import onHeaders from 'on-headers';
import * as winston from 'winston';

import {setDatabaseLogger} from '@rollingversions/db';

import {APEX_LOGS_CONFIG, ENVIRONMENT} from './environment';

const ApexLogsTransport = require('apex-logs-winston');

type levels =
  | 'debug'
  | 'info'
  | 'notice'
  | 'warning'
  | 'error'
  | 'crit'
  | 'alert'
  | 'emerg';
const levels = winston.config.syslog.levels;
const transports =
  ENVIRONMENT === 'development'
    ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({level: true}),
            winston.format.printf((info) => {
              return `${info.level} ${info.message}`;
            }),
          ),
        }),
      ]
    : [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({level: true}),
            winston.format.printf((info) => {
              return `${info.level} ${info.message}`;
            }),
          ),
        }),
        new ApexLogsTransport(APEX_LOGS_CONFIG),
      ];

const winLogger = winston.createLogger({
  levels: winston.config.syslog.levels,
  transports,
  defaultMeta: {
    environment: ENVIRONMENT,
  },
});

export {Logger};
class Logger {
  private readonly _win: winston.Logger;
  private readonly _txids: readonly string[];
  private readonly _startTime: number | undefined;
  constructor(
    win: winston.Logger,
    txids: readonly string[],
    startTime?: number,
  ) {
    this._win = win;
    this._txids = txids;
    this._startTime = startTime;
  }
  private _getMethod(level: levels) {
    return (
      event_type: string,
      message: string,
      context: {[key: string]: unknown} = {},
    ) => {
      this._win[level](message, {
        ...(this._startTime ? {duration: Date.now() - this._startTime} : {}),
        ...context,
        event_type,
      });
    };
  }

  public withContext(context: {[key: string]: unknown}) {
    return new Logger(this._win.child(context), this._txids);
  }
  public withTransaction(
    context: {txid?: string; [key: string]: unknown} = {},
  ) {
    const txid = context.txid || cuid();
    const txids = [...this._txids, txid];
    return new Logger(
      this._win.child({...context, txid: txids.join(':')}),
      txids,
    );
  }
  public withTimer() {
    return new Logger(this._win, this._txids, Date.now());
  }

  public readonly debug = this._getMethod('debug');
  public readonly info = this._getMethod('info');
  public readonly notice = this._getMethod('notice');
  public readonly warning = this._getMethod('warning');
  public readonly error = this._getMethod('error');
  public readonly crit = this._getMethod('crit');
  public readonly alert = this._getMethod('alert');
  public readonly emerg = this._getMethod('emerg');
}

const logger = new Logger(winLogger, []);
setDatabaseLogger(logger);
export default logger;

const expressLoggerKey = '@rollingversions/logger';
export function expressLogger(req: Request, res: Response): Logger {
  return (
    res.locals[expressLoggerKey] ??
    (res.locals[expressLoggerKey] = logger.withTransaction({
      method: req.method,
      url: req.url,
    }))
  );
}

export function expressMiddlewareLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const reqStartAt = process.hrtime();
    const logger = expressLogger(req, res);
    logger.info('request_start', `request start: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
    });
    let resStartElapsed: typeof reqStartAt | null = null;
    onHeaders(res, () => {
      resStartElapsed = process.hrtime(reqStartAt);
    });
    onFinished(res, (err, res) => {
      if (!resStartElapsed) {
        resStartElapsed = process.hrtime(reqStartAt);
      }

      const responseTimeMs =
        resStartElapsed[0] * 1e3 + resStartElapsed[1] * 1e-6;
      const resEndElapsed = process.hrtime(reqStartAt);
      const totalTimeMs = resEndElapsed[0] * 1e3 + resEndElapsed[1] * 1e-6;

      const message = `request end: ${req.method} ${req.url} ${
        res.statusCode
      } (${Math.round(responseTimeMs)} ms)${
        err ? `:\n\n${err.stack || err.message || err}` : ``
      }`;
      const ctxLogger = logger.withContext({
        method: req.method,
        url: req.url,
        status_code: res.statusCode,
        duration: Math.round(responseTimeMs),
        total_time: Math.round(totalTimeMs),
      });
      if (err || res.statusCode >= 500) {
        ctxLogger.error('response', message);
      } else if (res.statusCode >= 400) {
        ctxLogger.warning('response', message);
      } else {
        ctxLogger.info('response', message);
      }
    });
    next();
  };
}

export function errorLoggingMiddlware() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    const logger = expressLogger(req, res);
    logger.error('response_error', `${err.stack || err.message || err}`);
    next(err);
  };
}
