import * as t from 'funtypes';

import {PackageDependenciesCodec} from './PackageDependencies';
import {PublishTargetConfigCodec} from './PublishTarget';

export const PackageManifestCodec = t.Named(
  `PackageManifest`,
  t.Intersect(
    t.Readonly(
      t.Object({
        packageName: t.String,
        dependencies: PackageDependenciesCodec,
        targetConfigs: t.Readonly(t.Array(PublishTargetConfigCodec)),
      }),
    ),
    t.Readonly(
      t.Partial({
        /**
         * The tag format lets you override the tag that is generated in GitHub's releases
         */
        tagFormat: t.String,
      }),
    ),
  ),
);

type PackageManifest = t.Static<typeof PackageManifestCodec>;
export default PackageManifest;
