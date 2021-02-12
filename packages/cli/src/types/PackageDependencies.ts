import {t, compressedObjectCodec} from '../utils/ValidationCodec';

export default interface PackageDependencies {
  required: string[];
  optional: string[];
  development: string[];
}

export const PackageDependenciesCodec: t.Codec<PackageDependencies> = compressedObjectCodec(
  1,
  'PackageDependencies',
  {
    required: t.Array(t.String),
    optional: t.Array(t.String),
    development: t.Array(t.String),
  },
  ['required', 'optional', 'development'],
);

export function mergePackageDependencies(
  a: PackageDependencies,
  b: PackageDependencies,
): PackageDependencies {
  return {
    required: [...new Set([...a.required, ...b.required])],
    optional: [...new Set([...a.optional, ...b.optional])],
    development: [...new Set([...a.development, ...b.development])],
  };
}
