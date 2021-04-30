export interface PackageDependencies {
  required: string[];
  optional: string[];
  development: string[];
}

export interface CircularPackages {
  readonly circular: true;
  readonly packageNames: string[];
}
export interface SortedPackages<T> {
  readonly circular: false;
  readonly packages: readonly T[];
}

export type SortResult<T> = CircularPackages | SortedPackages<T>;

export default function sortPackagesByDependencies<T>(
  packages: Map<string, T>,
  getDependencies: (pkg: T) => PackageDependencies,
): SortResult<T> {
  function putPackage(
    stack: readonly string[],
    resultSoFar: SortedPackages<T>,
    pkgName: string,
    pkg: T,
  ): SortResult<T> {
    if (resultSoFar.packages.includes(pkg)) {
      return resultSoFar;
    }

    const stackIndex = stack.indexOf(pkgName);
    if (stackIndex !== -1) {
      return {
        circular: true,
        packageNames: stack.slice(stackIndex),
      };
    }

    let result = resultSoFar;

    const childStack = [...stack, pkgName];

    const dependencies = getDependencies(pkg);
    for (const kind of ['required', 'optional', 'development'] as const) {
      for (const dependencyName of dependencies[kind].slice().sort()) {
        const dep = packages.get(dependencyName);
        if (dep) {
          const child = putPackage(childStack, result, dependencyName, dep);
          if (child.circular) {
            if (kind === 'required' || !child.packageNames.includes(pkgName)) {
              return child;
            }
          } else {
            result = child;
          }
        }
      }
    }

    return {circular: false, packages: [...result.packages, pkg]};
  }

  let result: SortedPackages<T> = {
    circular: false,
    packages: [],
  };
  const EMPTY_ARRAY = [] as const;
  for (const [depName, dep] of [...packages].sort(([a], [b]) =>
    a < b ? -1 : 1,
  )) {
    const depResult = putPackage(EMPTY_ARRAY, result, depName, dep);
    if (depResult.circular) {
      return depResult;
    } else {
      result = depResult;
    }
  }
  return result;
}
