import mapGetOrSet from '../mapGetOrSet';

test('with empty map', () => {
  const getter = jest.fn().mockReturnValue(42);
  const map = new Map<string, number>();
  const result = mapGetOrSet(map, 'foo', getter);
  expect(result).toBe(42);
  expect(getter).toBeCalledTimes(1);
  expect(getter.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      undefined,
      "foo",
    ]
  `);
  expect(map.get('foo')).toBe(42);
});

test('with existing key in map', () => {
  const getter = jest.fn().mockReturnValue(42);
  const map = new Map<string, number>([['foo', 1]]);
  const result = mapGetOrSet(map, 'foo', getter);
  expect(result).toBe(42);
  expect(getter).toBeCalledTimes(1);
  expect(getter.mock.calls[0]).toMatchInlineSnapshot(`
    Array [
      1,
      "foo",
    ]
  `);
  expect(map.get('foo')).toBe(42);
});
