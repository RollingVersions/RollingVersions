import {
  t,
  compressedObjectCodec,
  versionSymbol,
} from '../utils/ValidationCodec';

export default interface PackageDependencies {
  required: string[];
  optional: string[];
  development: string[];
}

export const PackageDependenciesCodec = compressedObjectCodec<
  PackageDependencies
>()(
  1,
  'PackageDependencies',
  {
    required: t.array(t.string),
    optional: t.array(t.string),
    development: t.array(t.string),
  },
  [versionSymbol, 'required', 'optional', 'development'],
);
