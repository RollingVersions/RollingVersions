# @rollingversions/version-number

Utilities for manipulating versoin numbers in Rolling Versions. This package is designed to support a super-set of semver.

## Differences from semver

1. Instead of `<version core>` being in the form `<major> "." <minor> "." <patch>`, it is an arbitrary length array of numeric identifiers.
2. `<numeric identifier>`s are allowed to have leading `0`s. These leading `0`s are always ignored.
3. Numerical identifiers cannot consist of more than 15 digits (this allows values up to `999999999999999`, which is approximately 10x smaller than the maximum allowed by the node semver package). This allows us to perform the check on the string, rather than having to parse it first

The Backus–Naur Form Grammar deviates from SemVer 2.0.0 as follows:

```diff
- <version core> ::= <major> "." <minor> "." <patch>
- <major> ::= <numeric identifier>
- <minor> ::= <numeric identifier>
- <patch> ::= <numeric identifier>

+ <version core> ::= <dot separated version identifiers>
+
+ <dot-separated version identifiers> ::= <version identifier>
+                                       | <version identifier> "." + <dot-separated version identifiers>
+
+ <version identifier> ::= <numeric identifier>

- <numeric identifier> ::= "0"
-                        | <positive digit>
-                        | <positive digit> <digits>

+ <numeric identifier> ::= <digits>
```

## API

A version number consists of three parts:

```ts
interface VersionNumber {
  numerical: number[];
  prerelease: string[];
  build: string[];
}
```

- The `numerical` part is the main part of the version number. It is a list of integers ordered from most significant to least significant. In SemVer this will have 3 values: `[major, minor, patch]`
- The `prerelease` part is an array of strings that can be added to denote arbitrary pre-releases. When comparing, we treat any values in the prerelease array that are valid integers as being integers, and compare them numerically. Versions that do not have any prerelease strings are always considered "greater" (i.e. to be a more recent release) than versions that have prerelease strings.
- the `build` part is an additional arbitrary array of strings. Unlike the `prelease`, the `build` is completely ignored when comparing version numbers.

```ts
export declare function parseString(str: string): VersionNumber | null;
export declare function printString(version: VersionNumber): string;

export declare function normalize(
  version: VersionNumber,
  numericalLength: number,
): VersionNumber;
export declare function increment(
  version: VersionNumber,
  index: number,
): VersionNumber;

/**
 * Compare two version numbers (e.g. for sorting)
 * N.B. as per the "semver" spec, build metadata is always ignored
 * when comparing version numbers. This means that two version numbers
 * can be considered "equal" even if they have different build metadata
 */
export declare function compare(a: VersionNumber, b: VersionNumber): number;

export declare const eq: (a: VersionNumber, b: VersionNumber) => boolean;
export declare const neq: (a: VersionNumber, b: VersionNumber) => boolean;
export declare const gt: (a: VersionNumber, b: VersionNumber) => boolean;
export declare const gte: (a: VersionNumber, b: VersionNumber) => boolean;
export declare const lt: (a: VersionNumber, b: VersionNumber) => boolean;
export declare const lte: (a: VersionNumber, b: VersionNumber) => boolean;

export declare function isPrerelease(a: VersionNumber): boolean;

export declare const sortAscending: {
  (versions: readonly VersionNumber[]): VersionNumber[];
  <T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber,
  ): T[];
};

export declare const sortDescending: {
  (versions: readonly VersionNumber[]): VersionNumber[];
  <T>(
    versions: readonly T[],
    getVersionNumber: (value: T) => VersionNumber,
  ): T[];
};
```
