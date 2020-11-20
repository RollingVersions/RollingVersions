// TODO: publish this to npm

export default function mapGetOrSet<TKey, TResult>(
  // can be a Map<TKey, TResult> or WeakMap<TKey, TResult>, or any similar shape
  cache: {
    get(key: TKey): Exclude<TResult, undefined> | undefined;
    set(key: TKey, value: Exclude<TResult, undefined>): unknown;
  },
  key: TKey,
  fn: (key: TKey) => Exclude<TResult, undefined>,
  onFreshValue?: (value: Exclude<TResult, undefined>, key: TKey) => void,
): Exclude<TResult, undefined> {
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const fresh = fn(key);
  cache.set(key, fresh);
  if (onFreshValue) onFreshValue(fresh, key);
  return fresh;
}
