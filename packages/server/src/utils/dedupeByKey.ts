// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

export default function dedupeByKey<TKey, TResult>() {
  const cache = new Map<TKey, Promise<TResult>>();
  return async (key: TKey, fn: () => Promise<TResult>) => {
    return await mapGetOrSet(cache, key, async () => {
      try {
        return await fn();
      } finally {
        cache.delete(key);
      }
    });
  };
}
