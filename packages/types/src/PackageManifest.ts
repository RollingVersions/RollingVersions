import * as t from 'funtypes';

import {BaseVersionCodec} from './BaseVersion';
import {ChangeTypeCodec} from './ChangeType';
import {PackageDependenciesCodec} from './PackageDependencies';
import {PublishTargetConfigCodec, ScriptCodec} from './PublishTarget';
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

        scripts: t.Readonly(
          t.Object({
            pre_release: t.Readonly(t.Array(ScriptCodec)),
            post_release: t.Readonly(t.Array(ScriptCodec)),
          }),
        ),
        tag_format: t.Union(TagFormatCodec, t.Undefined),
        change_types: t.ReadonlyArray(ChangeTypeCodec),
        versioning_mode: VersioningModeCodec,
        version_schema: VersionSchemaCodec,
        base_version: BaseVersionCodec,
        customized: t.Readonly(
          t.Array(
            t.Union(
              t.Literal(`tag_format`),
              t.Literal(`change_types`),
              t.Literal(`versioning_mode`),
              t.Literal(`version_schema`),
              t.Literal(`base_version`),
            ),
          ),
        ),
      }),
    ),
  ),
);

type PackageManifest = t.Static<typeof PackageManifestCodec>;
export default PackageManifest;
