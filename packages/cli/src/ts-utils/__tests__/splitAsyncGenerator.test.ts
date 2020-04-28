import splitAsyncGenerator from '../splitAsyncGenerator';

test('splitAsyncGenerator', async () => {
  async function* source() {
    for (let i = 0; true; i++) {
      yield i;
    }
  }
  const split = splitAsyncGenerator(source());
  async function unreliableConsumer() {
    const result = [];
    for await (const value of split()) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.floor(100 * Math.random())),
      );
      result.push(value);
      if (result.length === 10) {
        return result;
      }
    }
    throw new Error('Should not get to end of infinite sequence');
  }

  const results = await Promise.all(
    Array.from({length: 20}).map(() => unreliableConsumer()),
  );
  expect(results.length).toBe(20);

  for (const result of results) {
    expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  }
});
