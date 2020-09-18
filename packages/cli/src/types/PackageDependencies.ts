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
