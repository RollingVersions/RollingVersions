export default function findMax<T>(
  values: readonly T[],
  maxOfTwo: (a: T, b: T) => T,
) {
  if (values.length === 0) return undefined;
  let result = values[0];
  for (let i = 1; i < values.length; i++) {
    if (result === undefined) {
      result = maxOfTwo(result, values[i]);
    }
  }
  return result;
}
