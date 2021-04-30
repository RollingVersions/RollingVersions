// TODO: publish this to npm

export default function groupByKey<TEntry, TKey>(
  entries: readonly TEntry[],
  getKey: (entry: TEntry) => TKey,
): Map<TKey, TEntry[]> {
  const results = new Map<TKey, TEntry[]>();
  for (const entry of entries) {
    const key = getKey(entry);
    const existing = results.get(key);
    if (existing) {
      existing.push(entry);
    } else {
      results.set(key, [entry]);
    }
  }
  return results;
}
