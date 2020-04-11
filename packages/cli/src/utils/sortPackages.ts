import {PublishConfig, PackageDependencies} from '../types';
import {getDependencies} from '../PublishTargets';
import {SuccessPackageStatus} from './getPackageStatuses';

export interface CircularPackages {
  readonly circular: true;
  readonly packageNames: string[];
}
export interface SortedPackages {
  readonly circular: false;
  readonly packages: readonly SuccessPackageStatus[];
}

export type SortResult = CircularPackages | SortedPackages;

export default function sortPackages(
  config: Pick<PublishConfig, 'dirname'>,
  statuses: SuccessPackageStatus[],
): SortResult {
  const input = new Map(
    statuses.map(
      (pkg) =>
        [
          pkg.packageName,
          {pkg, dependencies: getDependencies(config, pkg)},
        ] as const,
    ),
  );
  function putPackage(
    stack: readonly string[],
    resultSoFar: SortedPackages,
    {
      pkg,
      dependencies,
    }: {pkg: SuccessPackageStatus; dependencies: PackageDependencies},
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
      for (const dependencyName of dependencies[kind]) {
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

    return result;
  }

  let result: SortedPackages = {
    circular: false,
    packages: [],
  };
  const EMPTY_ARRAY = [] as const;
  for (const [, dep] of input) {
    const depResult = putPackage(EMPTY_ARRAY, result, dep);
    if (depResult.circular) {
      return depResult;
    } else {
      result = depResult;
    }
  }
  return result;
}
