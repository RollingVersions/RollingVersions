export default function batchArray<T>(
  input: T[],
  {maxBatchSize}: {maxBatchSize: number},
) {
  const batchCount = Math.ceil(input.length / maxBatchSize);
  const batchSize = Math.ceil(input.length / batchCount);
  const results: T[][] = [];
  for (let i = 0; i < input.length; i += batchSize) {
    results.push(input.slice(i, i + batchSize));
  }
  return results;
}
