import {
  getNextVersion,
  gt,
  increment,
  lt,
  max,
  min,
  normalize,
  parseString,
  printString,
  sortAscending,
  sortDescending,
} from '..';

test('parseString', () => {
  expect(parseString('1.0.0')).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });
  expect(parseString('001.0.0')).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });
  expect(parseString('1.0.0alpha.1.3')).toEqual(null);
  expect(parseString('1.0.0-alpha.1.3')).toEqual({
    numerical: [1, 0, 0],
    prerelease: ['alpha', '1', '3'],
    build: [],
  });
  expect(parseString('1.0.0+build.4')).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: ['build', '4'],
  });
  expect(parseString('1.0.0-alpha.1.3+build.4')).toEqual({
    numerical: [1, 0, 0],
    prerelease: ['alpha', '1', '3'],
    build: ['build', '4'],
  });
  expect(parseString('1.0.0alpha.1.3')).toEqual(null);
  expect(parseString('')).toEqual(null);
  expect(parseString('hello')).toEqual(null);
  expect(parseString('1.0.0-')).toEqual(null);
  expect(parseString('1.0.0+')).toEqual(null);
});

test('printString', () => {
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: [],
      build: [],
    }),
  ).toEqual('1.0.0');
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: ['alpha', '1', '3'],
      build: [],
    }),
  ).toEqual('1.0.0-alpha.1.3');
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: [],
      build: ['build', '4'],
    }),
  ).toEqual('1.0.0+build.4');
  expect(
    printString({
      numerical: [1, 0, 0],
      prerelease: ['alpha', '1', '3'],
      build: ['build', '4'],
    }),
  ).toEqual('1.0.0-alpha.1.3+build.4');
});

test('normalize', () => {
  expect(
    normalize(
      {
        numerical: [91, 92, 93],
        prerelease: ['alpha', '1'],
        build: ['a34'],
      },
      5,
    ),
  ).toEqual({
    numerical: [91, 92, 93, 0, 0],
    prerelease: ['alpha', '1'],
    build: ['a34'],
  });
  expect(
    normalize(
      {
        numerical: [91, 92, 93],
        prerelease: ['alpha', '1'],
        build: ['a34'],
      },
      2,
    ),
  ).toEqual({
    numerical: [91, 92],
    prerelease: ['alpha', '1'],
    build: ['a34'],
  });
});

test('increment', () => {
  expect(
    increment(
      {
        numerical: [91, 92, 93, 94, 95],
        prerelease: ['alpha', '1'],
        build: ['a34'],
      },
      2,
    ),
  ).toEqual({
    numerical: [91, 92, 94, 0, 0],
    prerelease: [],
    build: [],
  });
});

test('gt', () => {
  expect(
    gt(
      {numerical: [1, 16, 0], prerelease: [], build: []},
      {numerical: [1, 8, 0], prerelease: [], build: []},
    ),
  ).toBe(true);
  expect(
    gt(
      {numerical: [1, 8, 0], prerelease: [], build: []},
      {numerical: [1, 16, 0], prerelease: [], build: []},
    ),
  ).toBe(false);
});

test('lt', () => {
  expect(
    lt(
      {numerical: [1, 8, 0], prerelease: ['alpha', '1'], build: []},
      {numerical: [1, 8, 0], prerelease: [], build: []},
    ),
  ).toBe(true);
});

test('sortAscending', () => {
  expect(
    sortAscending(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!),
  ).toEqual(['1.0.0', '2.0.0', '3.0.0']);
});

test('sortDescending', () => {
  expect(
    sortDescending(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!),
  ).toEqual(['3.0.0', '2.0.0', '1.0.0']);
});

test('min', () => {
  expect(min(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!)).toBe(
    '1.0.0',
  );
});
test('max', () => {
  expect(max(['2.0.0', '1.0.0', '3.0.0'], (v) => parseString(v)!)).toBe(
    '3.0.0',
  );
});

test('getNextVersion', () => {
  expect(getNextVersion(null, [])).toEqual(null);

  expect(
    getNextVersion(
      {
        numerical: [2, 0, 0],
        prerelease: [],
        build: [],
      },
      [],
    ),
  ).toEqual(null);

  expect(getNextVersion(null, [{type: 'feat'}])).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });

  expect(
    getNextVersion(
      {
        numerical: [0, 1, 0],
        prerelease: [],
        build: [],
      },
      [{type: 'feat'}],
    ),
  ).toEqual({
    numerical: [1, 0, 0],
    prerelease: [],
    build: [],
  });

  expect(
    getNextVersion(
      {
        numerical: [2, 0, 0],
        prerelease: [],
        build: [],
      },
      [{type: 'feat'}],
    ),
  ).toEqual({
    numerical: [2, 1, 0],
    prerelease: [],
    build: [],
  });

  expect(
    getNextVersion(
      {
        numerical: [2, 0, 0],
        prerelease: [],
        build: [],
      },
      [{type: 'feat'}, {type: 'breaking'}, {type: 'fix'}],
    ),
  ).toEqual({
    numerical: [3, 0, 0],
    prerelease: [],
    build: [],
  });
});
