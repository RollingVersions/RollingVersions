import mapGetOrSet from '../mapGetOrSet';

test('with empty map', () => {
  const getter = jest.fn().mockReturnValue(42);
  const map = new Map<string, number>();
  const result = mapGetOrSet(map, 'foo', getter);
  expect(result).toBe(42);
  expect(getter).toBeCalledTimes(1);
  expect(map.get('foo')).toBe(42);
});

test('with existing key in map', () => {
  const getter = jest.fn().mockReturnValue(1);
  const map = new Map<string, number>([['foo', 42]]);
  const result = mapGetOrSet(map, 'foo', getter);
  expect(result).toBe(42);
  expect(getter).not.toBeCalled();
  expect(map.get('foo')).toBe(42);
});

test('with empty map and method after populating', () => {
  const getter = jest.fn().mockReturnValue(42);
  const map = new Map<string, number>();
  const onValue = jest.fn().mockImplementation((value, key) => {
    expect(value).toBe(42);
    expect(key).toBe('foo');
    // expect the map to already be populated
    expect(map.get('foo')).toBe(42);
  });
  const result = mapGetOrSet(map, 'foo', getter, onValue);
  expect(result).toBe(42);
  expect(getter).toBeCalledTimes(1);
  expect(map.get('foo')).toBe(42);
  expect(onValue).toBeCalledTimes(1);
});

test('with existing key in map and method after populating', () => {
  const getter = jest.fn().mockReturnValue(1);
  const onValue = jest.fn();
  const map = new Map<string, number>([['foo', 42]]);
  const result = mapGetOrSet(map, 'foo', getter, onValue);
  expect(result).toBe(42);
  expect(getter).not.toBeCalled();
  expect(map.get('foo')).toBe(42);
  expect(onValue).not.toBeCalled();
});
