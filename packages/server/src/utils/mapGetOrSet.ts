// TODO: publish this to npm
const recursionBlocker = new Map<unknown, Set<unknown>>();

// "cache" can be a Map<TKey, TResult> or WeakMap<TKey, TResult>, or any similar shape
// if your "reducer" returns undefined, the key is deleted (or not set if it didn't exist)
export default function mapGetOrSet<TKey, TResult>(
  cache: {
    get(key: TKey): Exclude<TResult, undefined> | undefined;
    set(key: TKey, value: Exclude<TResult, undefined>): unknown;
    delete(key: TKey): unknown;
  },
  key: TKey,
  reducer: (
    existingValue: Exclude<TResult, undefined> | undefined,
    key: TKey,
  ) => Exclude<TResult, undefined>,
): Exclude<TResult, undefined>;
export default function mapGetOrSet<TKey, TResult>(
  cache: {
    get(key: TKey): Exclude<TResult, undefined> | undefined;
    set(key: TKey, value: Exclude<TResult, undefined>): unknown;
    delete(key: TKey): unknown;
  },
  key: TKey,
  reducer: (
    existingValue: Exclude<TResult, undefined> | undefined,
    key: TKey,
  ) => Exclude<TResult, undefined> | undefined,
): Exclude<TResult, undefined> | undefined;
export default function mapGetOrSet<TKey, TResult>(
  // can be a Map<TKey, TResult> or WeakMap<TKey, TResult>, or any similar shape
  cache: {
    get(key: TKey): Exclude<TResult, undefined> | undefined;
    set(key: TKey, value: Exclude<TResult, undefined>): unknown;
    delete(key: TKey): unknown;
  },
  key: TKey,
  reducer: (
    existingValue: Exclude<TResult, undefined> | undefined,
    key: TKey,
  ) => Exclude<TResult, undefined> | undefined,
): Exclude<TResult, undefined> | undefined {
  const inProgressKeys = basicMapGetOrSet(
    recursionBlocker,
    cache,
    () => new Set(),
  );
  if (inProgressKeys.has(key)) {
    throw new Error(
      `You made a recursive call to "mapGetOrSet" with the same key: ${primativeInspect(
        key,
      )}`,
    );
  }
  try {
    const cached = cache.get(key);
    if (cached !== undefined) {
      const updated = reducer(cached, key);
      if (updated === undefined) {
        cache.delete(key);
      } else if (cached !== updated) {
        cache.set(key, updated);
      }
      return updated;
    }

    const fresh = reducer(undefined, key);
    if (fresh !== undefined) {
      cache.set(key, fresh);
    }
    return fresh;
  } finally {
    inProgressKeys.delete(key);
    if (!inProgressKeys.size) {
      recursionBlocker.delete(cache);
    }
  }
}

function basicMapGetOrSet<TKey, TResult>(
  cache: {
    get(key: TKey): TResult | undefined;
    set(key: TKey, value: TResult): unknown;
  },
  key: TKey,
  fn: (key: TKey) => TResult,
): TResult {
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const fresh = fn(key);
  if (fresh) {
    cache.set(key, fresh);
  }
  return fresh;
}

function primativeInspect(value: unknown): string {
  try {
    return JSON.stringify(value) || typeof value;
  } catch (ex) {
    return typeof value;
  }
}
