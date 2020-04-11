export default function groupBy<T, TKey>(values: T[], getKey: (v: T) => TKey) {
  const grouped = new Map<TKey, T[]>(
    [...new Set(values.map((v) => getKey(v)))].map((key) => [key, []]),
  );
  values.forEach((v) => {
    grouped.get(getKey(v))!.push(v);
  });
  return grouped;
}
