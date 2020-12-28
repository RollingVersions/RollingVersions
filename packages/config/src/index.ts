import * as t from 'funtypes';

const MAX_VERSION_SCHEMA_LENGTH = 16;
const MAX_KEY_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 64;
const MAX_TAG_FORMAT_LENGTH = 64;

export const DEFAULT_VERSION_SCHEMA: VersionSchema = [
  'MAJOR',
  'MINOR',
  'PATCH',
];
export const DEFAULT_CHANGE_TYPES = [
  ct('breaking', 'MAJOR', 'Breaking Changes'),
  ct('feat', 'MINOR', 'New Features'),
  ct('refactor', 'MINOR', 'Refactors'),
  ct('perf', 'PATCH', 'Performance Improvements'),
  ct('fix', 'PATCH', 'Bug Fixes'),
];
export const DEFAULT_BASE_VERSION = (vs: VersionSchema): readonly number[] =>
  vs.map((_, i) => (i === 0 ? 1 : 0));

export type ChangeTypeID = string & {__brand?: 'ChangeTypeID'};
export type VersionBumpType = string & {__brand?: 'VersionBumpType'};

export interface ChangeType {
  readonly id: ChangeTypeID;
  readonly plural: string;
  readonly bumps: VersionBumpType | null;
}
export type VersionSchema = readonly [
  VersionBumpType,
  ...(readonly VersionBumpType[])
];

export default interface RollingConfigOptions {
  readonly tagFormat: string | undefined;
  readonly changeTypes: readonly ChangeType[];
  readonly versionSchema: VersionSchema;
  readonly baseVersion: readonly number[];
}

function withMaxLength<T extends {readonly length: number}>(
  codec: t.Codec<T>,
  maxLength: number,
): t.Codec<T> {
  return t.Constraint(
    codec,
    (value) =>
      value.length > maxLength
        ? `Length must not be greater than ${maxLength}`
        : true,
    {name: `MaxLength<${codec.show ? codec.show(false) : codec.tag}>`},
  );
}

const StringKey = withMaxLength(t.String, MAX_KEY_LENGTH);
const StringDescription = withMaxLength(t.String, MAX_DESCRIPTION_LENGTH);
const StringTagFormat = withMaxLength(t.String, MAX_TAG_FORMAT_LENGTH);

const ChangeTypeCodec: t.Codec<ChangeType> = t.Object({
  id: StringKey,
  bumps: t.Union(StringKey, t.Null),
  plural: StringDescription,
});

const VersionSchemaCodec: t.Codec<VersionSchema> = withMaxLength(
  t.ReadonlyArray(StringKey),
  MAX_VERSION_SCHEMA_LENGTH,
).withGuard(
  <T>(x: readonly T[]): x is readonly [T, ...(readonly T[])] => x.length !== 0,
  {name: 'VersionSchema'},
);

const RollingConfigOptionsCodec: t.Codec<RollingConfigOptions> = t
  .Partial({
    tagFormat: StringTagFormat,
    changeTypes: t.ReadonlyArray(ChangeTypeCodec),
    versionSchema: VersionSchemaCodec,
    baseVersion: t.ReadonlyArray(
      t.Number.withConstraint((v) =>
        v !== Math.floor(v)
          ? 'Version parts must be whole numbers'
          : v < 0
          ? 'Version parts cannot be less than 0'
          : v > Number.MAX_SAFE_INTEGER
          ? 'Version parts must be less than MAX_SAFE_INTEGER'
          : true,
      ),
    ),
  })
  .withParser({
    parse: ({
      tagFormat,
      changeTypes = DEFAULT_CHANGE_TYPES,
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
        value: {tagFormat, changeTypes, versionSchema, baseVersion},
      };
    },
    name: 'RollingConfigOptions',
  });

export function parseRollingConfigOptions(
  value: Partial<RollingConfigOptions>,
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
