import * as t from 'funtypes';

export const PackageDependenciesCodec = t.Named(
  `PackageDependencies`,
  t.Readonly(
    t.Object({
      required: t.Readonly(t.Array(t.String)),
      optional: t.Readonly(t.Array(t.String)),
      development: t.Readonly(t.Array(t.String)),
    }),
  ),
);

type PackageDependencies = t.Static<typeof PackageDependenciesCodec>;
export default PackageDependencies;
