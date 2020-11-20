// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

export default function dedupeByKey<TKey, TResult>() {
  const cache = new Map<TKey, Promise<TResult>>();
  return async (key: TKey, fn: (key: TKey) => Promise<TResult>) => {
    return await mapGetOrSet(
      cache,
      key,
      async () => await fn(key),
      (result) =>
        result.then(
          () => cache.delete(key),
          () => cache.delete(key),
        ),
    );
  };
}
