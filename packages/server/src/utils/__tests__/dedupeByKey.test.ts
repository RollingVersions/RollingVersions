import dedupeByKey from '../dedupeByKey';

test('dedupeByKey', async () => {
  const dedupe = dedupeByKey<string, number>();
  const getter = jest.fn().mockImplementation(async (key: string) => {
    await new Promise((r) => setTimeout(r, 100));
    return key.length;
  });
  // parallel requests are always deduped
  const results = await Promise.all([
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('foo', getter),
    dedupe('hello world', getter),
    dedupe('hello world', getter),
    dedupe('hello world', getter),
    dedupe('hello world', getter),
  ]);
  expect(results).toEqual([
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'foo'.length,
    'hello world'.length,
    'hello world'.length,
    'hello world'.length,
    'hello world'.length,
  ]);
  expect(getter).toBeCalledTimes(2);

  // sequential requests are not deduped
  expect(await dedupe('foo', getter)).toBe('foo'.length);
  expect(await dedupe('foo', getter)).toBe('foo'.length);
  expect(await dedupe('foo', getter)).toBe('foo'.length);
  expect(getter).toBeCalledTimes(5);
});
