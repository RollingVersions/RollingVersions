// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

function debounceOnce<TResult>(onEndFinal: () => void) {
  let running = false;
  let onEnd: () => void = onEndFinal;
  let queueResult: undefined | Promise<TResult>;
  let resolveQueueResult: (v: Promise<TResult>) => void = () => {
    throw new Error(
      'This function should always be replaced before it is called',
    );
  };
  return async (fn: () => Promise<TResult>): Promise<TResult> => {
    if (running) {
      onEnd = () => {
        onEnd = onEndFinal;
        queueResult = undefined;
        resolveQueueResult(
          Promise.resolve(null).then(async () => {
            try {
              return await fn();
            } finally {
              onEnd();
            }
          }),
        );
      };
      if (!queueResult) {
        queueResult = new Promise((resolve) => {
          resolveQueueResult = resolve;
        });
      }
      return await queueResult;
    } else {
      running = true;
      try {
        return await fn();
      } finally {
        onEnd();
      }
    }
  };
}

export default function debounceByKey<TKey, TResult>() {
  const debouncers = new Map<
    TKey,
    (fn: () => Promise<TResult>) => Promise<TResult>
  >();
  return async (key: TKey, fn: (key: TKey) => Promise<TResult>) => {
    return await mapGetOrSet(
      debouncers,
      key,
      (existingValue) =>
        existingValue || debounceOnce(() => debouncers.delete(key)),
    )(() => fn(key));
  };
}
