import * as t from 'funtypes';

import {
  BaseVersionCodec,
  ChangeType,
  ChangeTypeCodec,
  ChangeTypeID,
  RollingConfigOptions,
  TagFormatCodec,
  VersionBumpType,
  VersioningMode,
  VersioningModeCodec,
  VersionSchema,
  VersionSchemaCodec,
} from '@rollingversions/types';

export const DEFAULT_VERSION_SCHEMA: VersionSchema = [
  'MAJOR',
  'MINOR',
  'PATCH',
];
export const DEFAULT_CHANGE_TYPES = [
  ct('breaking', 'MAJOR', 'Breaking Changes'),
  ct('feat', 'MINOR', 'New Features'),
  ct('refactor', 'MINOR', 'Refactors'),
  ct('fix', 'PATCH', 'Bug Fixes'),
  ct('perf', 'PATCH', 'Performance Improvements'),
];
export const DEFAULT_BASE_VERSION = (vs: VersionSchema): readonly number[] =>
  vs.map((_, i) => (i === 0 ? 1 : 0));

export default RollingConfigOptions;

const RollingConfigOptionsCodec: t.Codec<RollingConfigOptions> = t
  .Partial({
    tagFormat: TagFormatCodec,
    changeTypes: t.ReadonlyArray(ChangeTypeCodec),
    versioningMode: VersioningModeCodec,
    versionSchema: VersionSchemaCodec,
    baseVersion: BaseVersionCodec,
  })
  .withParser({
    parse: ({
      tagFormat,
      changeTypes = DEFAULT_CHANGE_TYPES,
      versioningMode = VersioningMode.Unambiguous,
      versionSchema = DEFAULT_VERSION_SCHEMA,
      baseVersion = DEFAULT_BASE_VERSION(versionSchema),
    }): t.Result<RollingConfigOptions> => {
      if (baseVersion.length !== versionSchema.length) {
        return {
          success: false,
          message: `If you specify a custom versionSchema and a custom baseVersion, they must be the same length.`,
        };
      }
      const parts = new Set(versionSchema);
      const changeTypeWithMissingBump = changeTypes.find(
        (changeType) =>
          changeType.bumps !== null && !parts.has(changeType.bumps),
      );
      if (changeTypeWithMissingBump) {
        return {
          success: false,
          message: `The change type "${changeTypeWithMissingBump.id}" is set to bump "${changeTypeWithMissingBump.bumps}" but that string does not exist in the versionSchema. Set bumps to null if you don't want changes of this type to trigger a release.`,
        };
      }
      return {
        success: true,
        value: {
          tagFormat,
          changeTypes,
          versioningMode,
          versionSchema,
          baseVersion,
        },
      };
    },
    name: 'RollingConfigOptions',
  });

export const DEFAULT_CONFIG = {
  tagFormat: undefined,
  changeTypes: DEFAULT_CHANGE_TYPES,
  versioningMode: VersioningMode.Unambiguous,
  versionSchema: DEFAULT_VERSION_SCHEMA,
  baseVersion: DEFAULT_BASE_VERSION(DEFAULT_VERSION_SCHEMA),
};
export function parseRollingConfigOptions(
  value: Partial<{[key in keyof RollingConfigOptions]: unknown}>,
):
  | {success: true; value: RollingConfigOptions}
  | {success: false; reason: string} {
  const res = RollingConfigOptionsCodec.safeParse(value);
  return res.success ? res : {success: false, reason: t.showError(res)};
}

function ct(
  id: ChangeTypeID,
  bumps: VersionBumpType,
  plural: string,
): ChangeType {
  return {id, bumps, plural};
}
