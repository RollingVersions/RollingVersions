export default function groupBy<T, TKey>(values: T[], getKey: (v: T) => TKey) {
  const byPath = new Map<TKey, T[]>(
    [...new Set(values.map((v) => getKey(v)))].map((path) => [path, []]),
  );
  values.forEach((v) => {
    byPath.get(getKey(v))!.push(v);
  });
  return byPath;
}
