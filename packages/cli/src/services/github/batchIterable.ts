export default async function* batchIterable<TEntry>(
  source: AsyncGenerator<TEntry, void, unknown>,
  batchSize: number,
) {
  let batch: TEntry[] = [];
  for await (const entry of source) {
    batch.push(entry);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length) {
    yield batch;
  }
}
