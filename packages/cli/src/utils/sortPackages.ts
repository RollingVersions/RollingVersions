import type {PackageStatusDetail} from './getPackageStatuses';

export interface CircularPackages {
  readonly circular: true;
  readonly packageNames: string[];
}
export interface SortedPackages {
  readonly circular: false;
  readonly packages: readonly PackageStatusDetail[];
}

export type SortResult = CircularPackages | SortedPackages;

export default async function sortPackages(
  statuses: PackageStatusDetail[],
): Promise<SortResult> {
  const input = new Map(
    await Promise.all(
      statuses.map(async (pkg) => [pkg.packageName, pkg] as const),
    ),
  );
  function putPackage(
    stack: readonly string[],
    resultSoFar: SortedPackages,
    pkg: PackageStatusDetail,
  ): SortResult {
    if (resultSoFar.packages.includes(pkg)) {
      return resultSoFar;
    }

    const stackIndex = stack.indexOf(pkg.packageName);
    if (stackIndex !== -1) {
      return {
        circular: true,
        packageNames: stack.slice(stackIndex),
      };
    }

    let result = resultSoFar;

    const childStack = [...stack, pkg.packageName];

    for (const kind of ['required', 'optional', 'development'] as const) {
      for (const dependencyName of pkg.manifest.dependencies[kind]
        .slice()
        .sort()) {
        const dep = input.get(dependencyName);
        if (dep) {
          const child = putPackage(childStack, result, dep);
          if (child.circular) {
            if (
              kind === 'required' ||
              !child.packageNames.includes(pkg.packageName)
            ) {
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

  let result: SortedPackages = {
    circular: false,
    packages: [],
  };
  const EMPTY_ARRAY = [] as const;
  for (const [, dep] of [...input].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const depResult = putPackage(EMPTY_ARRAY, result, dep);
    if (depResult.circular) {
      return depResult;
    } else {
      result = depResult;
    }
  }
  return result;
}
