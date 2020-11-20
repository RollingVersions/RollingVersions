export default function splitAsyncGenerator<T, TReturn>(
  input: AsyncGenerator<T, TReturn, unknown>,
): () => AsyncGenerator<T, TReturn, unknown> {
  const received: Promise<IteratorResult<T, TReturn>>[] = [];
  async function getNext(index: number) {
    if (index < received.length) return await received[index];

    const next = input.next();
    received.push(next);
    return await next;
  }
  return async function* (): AsyncGenerator<T, TReturn, undefined> {
    let i = 0;
    let next = await getNext(i++);
    while (!next.done) {
      yield next.value;
      next = await getNext(i++);
    }
    return next.value;
  };
}
