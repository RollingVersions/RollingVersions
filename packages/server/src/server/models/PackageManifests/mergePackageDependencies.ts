import {PackageDependencies} from '@rollingversions/types';

export default function mergePackageDependencies(
  a: PackageDependencies,
  b: PackageDependencies,
): PackageDependencies {
  return {
    required: [...new Set([...a.required, ...b.required])],
    optional: [...new Set([...a.optional, ...b.optional])],
    development: [...new Set([...a.development, ...b.development])],
  };
}
