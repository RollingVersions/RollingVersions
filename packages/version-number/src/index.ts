const MAX_LENGTH = 256;
const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;
const MAX_SAFE_INTEGER_LENGTH = MAX_SAFE_INTEGER.toString(10).length;

interface VersionNumber {
  readonly numerical: readonly number[];
  readonly prerelease: readonly string[];
  readonly build: readonly string[];
}
export default VersionNumber;

function parseInteger(str: string | undefined): number | undefined {
  if (!str) return undefined;
  if (!/^\d+$/.test(str)) return undefined;
  if (str.length > MAX_SAFE_INTEGER_LENGTH) return undefined;
  const int = parseInt(str, 10);
  if (int > MAX_SAFE_INTEGER) return undefined;
  return int;
}

function parseDotSeparated<T>(
  getMatch: (str: string) => string | undefined,
  parseMatch: (str: string) => T | undefined,
) {
  return (str: string): [boolean, string, T[]] => {
    let remaining = str;
    const values = [];
    let match = getMatch(remaining);
    while (match) {
      const value = parseMatch(match);
      if (value === undefined) break;

      values.push(value);

      if (
        match.length === remaining.length ||
        remaining[match.length] !== '.'
      ) {
        return [true, remaining.substr(match.length), values];
      }

      remaining = remaining.substr(match.length);
      match = getMatch(remaining);
    }
    return [false, remaining, values];
  };
}

const parseDotSeparatedInt = parseDotSeparated(
  (str) => /^[0-9]+/i.exec(str)?.[0],
  parseInteger,
);
const parseDotSeparatedIdentifier = parseDotSeparated(
  (str) => /^[a-z0-9-]+/i.exec(str)?.[0],
  (str) => str,
);

/**
 * Parse an optional section with a required prefix
 */
function parsePrefix<T>(
  prefix: string,
  parser: (str: string) => [boolean, string, T[]],
): (str: string) => [boolean, string, T[]] {
  return (str) => {
    if (str.startsWith(prefix)) return parser(str.substr(prefix.length));
    else return [true, str, []];
  };
}

const parsePrerelease = parsePrefix('-', parseDotSeparatedIdentifier);
const parseBuild = parsePrefix('+', parseDotSeparatedIdentifier);

export function parseString(str: string): VersionNumber | null {
  if (str.length >= MAX_LENGTH) {
    return null;
  }

  const [numericalValid, afterNumerical, numerical] = parseDotSeparatedInt(
    str.startsWith('v') ? str.substr(1) : str,
  );

  if (!numericalValid) return null;

  const [prereleaseValid, afterPrerelease, prerelease] = parsePrerelease(
    afterNumerical,
  );

  if (!prereleaseValid) return null;

  const [buildValid, afterBuild, build] = parseBuild(afterPrerelease);

  if (!buildValid || afterBuild.length) return null;

  return {numerical, prerelease, build};
}

export function printString(version: VersionNumber): string {
  let result = version.numerical.map((v) => v.toString(10)).join('.');
  if (version.prerelease.length) {
    result += `-${version.prerelease.join('.')}`;
  }
  if (version.build.length) {
    result += `+${version.build.join('.')}`;
  }
  return result;
}

export function normalize(version: VersionNumber, numericalLength: number) {
  if (version.numerical.length === numericalLength) return version;
  return {
    numerical: Array.from({length: numericalLength}).map((_, i) =>
      i < version.numerical.length ? i : 0,
    ),
    prerelease: version.prerelease,
    build: version.build,
  };
}

export function increment(
  version: VersionNumber,
  index: number,
): VersionNumber {
  return {
    numerical: version.numerical.map((v, i) =>
      i < index ? v : i === index ? v + 1 : 0,
    ),
    prerelease: [],
    build: [],
  };
}

enum ABComparison {
  B_IS_GREATER = -1,
  Equal = 0,
  A_IS_GREATER = 1,
}

const compareNumbers = (a: number, b: number) => {
  return a === b
    ? 0
    : a < b
    ? ABComparison.B_IS_GREATER
    : ABComparison.A_IS_GREATER;
};

/**
 * If both strings are valid integers, they are compared numerically.
 * If one string is an integer and the other is not, the integer is smaller than the arbitrary string.
 * Otherwise they are compared alphabetically.
 */
const compareIdentifiers = (a: string, b: string) => {
  const anum = /^[0-9]+$/.test(a);
  const bnum = /^[0-9]+$/.test(b);

  if (anum && bnum) {
    return compareNumbers(parseInt(a, 10), parseInt(b, 10));
  }

  if (a === b) return ABComparison.Equal;
  if (anum && !bnum) return ABComparison.B_IS_GREATER;
  if (bnum && !anum) return ABComparison.A_IS_GREATER;

  return a < b ? ABComparison.B_IS_GREATER : ABComparison.A_IS_GREATER;
};

function compareArrays<T>(
  compareValue: (aValue: T, bValue: T) => ABComparison,
  compareLength: (
    a: {readonly length: number},
    b: {readonly length: number},
  ) => ABComparison,
): (a: readonly T[], b: readonly T[]) => ABComparison {
  return (a, b) => {
    for (let i = 0; i < a.length && i < b.length; i++) {
      const comparison = compareValue(a[i], b[i]);
      if (comparison !== ABComparison.Equal) return comparison;
    }
    return compareLength(a, b);
  };
}

/**
 * Compare the "numerical" portion of two version numbers. If the two version numbers
 * are different lengths, all the excess values in the longer version number are ignored.
 * 1.0.0 < 2.0.0 < 2.9.0 < 2.19.0
 */
const compareMain = compareArrays<number>(
  compareNumbers,
  () => ABComparison.Equal,
);

/**
 * Compare the "prerelease" portion of two version numbers.
 *
 * If one of the version numbers does not have any prerelease strings, it is greater
 * than the one with prerelease strings.
 *
 * If the prerelease arrays are different lengths, and all values up to the
 * minimum length are equal, the longer array is greater than the shorter one.
 */
const comparePre = compareArrays<string>(compareIdentifiers, (a, b) => {
  // 1.0.0-beta < 1.0.0
  if (a.length && !b.length) return ABComparison.B_IS_GREATER;
  if (!a.length && b.length) return ABComparison.A_IS_GREATER;

  // 1.0.0-beta < 1.0.0-beta.1
  if (a.length < b.length) return ABComparison.B_IS_GREATER;
  if (a.length > b.length) return ABComparison.A_IS_GREATER;

  return ABComparison.Equal;
});

function _compare(a: VersionNumber, b: VersionNumber) {
  return (
    compareMain(a.numerical, b.numerical) ||
    comparePre(a.prerelease, b.prerelease)
  );
}

/**
 * Compare two version numbers (e.g. for sorting)
 * N.B. as per the "semver" spec, build metadata is always ignored
 * when comparing version numbers. This means that two version numbers
 * can be considered "equal" even if they have different build metadata
 */
export function compare(a: VersionNumber, b: VersionNumber): number {
  return _compare(a, b);
}

function resultIs(...types: readonly ABComparison[]) {
  return (a: VersionNumber, b: VersionNumber) => {
    const result = _compare(a, b);
    return types.includes(result);
  };
}

export const eq = resultIs(ABComparison.Equal);
export const neq = resultIs(
  ABComparison.A_IS_GREATER,
  ABComparison.B_IS_GREATER,
);
export const gt = resultIs(ABComparison.A_IS_GREATER);
export const gte = resultIs(ABComparison.A_IS_GREATER, ABComparison.Equal);
export const lt = resultIs(ABComparison.B_IS_GREATER);
export const lte = resultIs(ABComparison.B_IS_GREATER, ABComparison.Equal);

export function isPrerelease(a: VersionNumber) {
  return a.prerelease.length !== 0;
}

function sorter(order: 1 | -1) {
  function sort(versions: readonly VersionNumber[]): VersionNumber[];
  function sort<T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber,
  ): T[];
  function sort<T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber = (value: any) => value,
  ): T[] {
    return versions
      .slice()
      .sort(
        (a, b) => compare(getVersionNumber(a), getVersionNumber(b)) * order,
      );
  }
  return sort;
}
export const sortAscending = sorter(1);
export const sortDescending = sorter(-1);
