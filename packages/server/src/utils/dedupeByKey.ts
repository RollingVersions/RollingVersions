// TODO: publish this to npm

import mapGetOrSet from './mapGetOrSet';

export default function dedupeByKey<TKey, TResult>() {
  const cache = new Map<TKey, Promise<TResult>>();
  return async (key: TKey, fn: (key: TKey) => Promise<TResult>) => {
    return await mapGetOrSet(
      cache,
      key,
      async (existingValue) =>
        existingValue ??
        fn(key).then(
          (result) => {
            cache.delete(key);
            return result;
          },
          (error) => {
            cache.delete(key);
            throw error;
          },
        ),
    );
  };
}
