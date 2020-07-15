interface LogEvent {
  event_status: 'ok' | 'warn' | 'error';
  event_type: string;
  message: string;
  [key: string]: any;
}
export default function log({message, ...event}: LogEvent) {
  console.info(
    JSON.stringify({...event, log: message, app: 'rollingversions'}),
  );
}

export async function withLogging<T>(
  fn: Promise<T> | (() => Promise<T>),
  {
    success,
    successMessage,
    failure,
  }: {success: string; successMessage: string; failure: string},
): Promise<T> {
  const start = Date.now();
  let result;
  try {
    result = await (typeof fn === 'function' ? fn() : fn);
    log({
      event_status: 'ok',
      event_type: success,
      message: successMessage,
      duration: Date.now() - start,
    });
  } catch (ex) {
    log({
      event_status: 'error',
      event_type: failure,
      message: ex.stack,
      duration: Date.now() - start,
    });
    throw ex;
  }
  return result;
}

export function withLoggingFn<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  logging: {success: string; successMessage: string; failure: string},
): (...args: TArgs) => Promise<TResult> {
  return async (...args) => {
    return withLogging(fn(...args), logging);
  };
}
