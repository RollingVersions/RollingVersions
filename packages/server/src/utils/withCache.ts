import Cache from 'quick-lru';

export default function withCache<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<{result: TResult; expiry: number}>,
  getKey: (...args: TArgs) => any,
) {
  const cache = new Cache<any, Promise<{result: TResult; expiry: number}>>({
    maxSize: 10,
  });
  return async (...args: TArgs): Promise<TResult> => {
    const key = getKey(...args);
    const cachedPromise = cache.get(key);
    if (cachedPromise) {
      const cached = await cachedPromise;
      if (cached.expiry > Date.now()) {
        return cached.result;
      }
    }
    const livePromise = fn(...args);
    cache.set(key, livePromise);
    try {
      const live = await livePromise;
      if (live.expiry < Date.now()) {
        cache.delete(key);
      }
      return live.result;
    } catch (ex) {
      cache.delete(key);
      throw ex;
    }
  };
}
