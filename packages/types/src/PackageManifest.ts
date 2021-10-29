import * as t from 'funtypes';

import {BaseVersionCodec} from './BaseVersion';
import {ChangeTypeCodec} from './ChangeType';
import {PackageDependenciesCodec} from './PackageDependencies';
import {PublishTargetConfigCodec} from './PublishTarget';
import {TagFormatCodec} from './Strings';
import {VersioningModeCodec} from './VersioningMode';
import {VersionSchemaCodec} from './VersionSchema';

export const PackageManifestCodec = t.Named(
  `PackageManifest`,
  t.Intersect(
    t.Readonly(
      t.Object({
        packageName: t.String,
        dependencies: PackageDependenciesCodec,
        targetConfigs: t.Readonly(t.Array(PublishTargetConfigCodec)),

        tagFormat: t.Union(TagFormatCodec, t.Undefined),
        changeTypes: t.ReadonlyArray(ChangeTypeCodec),
        versioningMode: VersioningModeCodec,
        versionSchema: VersionSchemaCodec,
        baseVersion: BaseVersionCodec,
        customized: t.Readonly(
          t.Array(
            t.Union(
              t.Literal(`tagFormat`),
              t.Literal(`changeTypes`),
              t.Literal(`versioningMode`),
              t.Literal(`versionSchema`),
              t.Literal(`baseVersion`),
            ),
          ),
        ),
      }),
    ),
  ),
);

type PackageManifest = t.Static<typeof PackageManifestCodec>;
export default PackageManifest;
