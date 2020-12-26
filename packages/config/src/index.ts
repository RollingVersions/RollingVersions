import * as t from 'funtypes';
import ChangeSet, {
  ChangeType as ChangeTypeBase,
  ChangeTypeID,
} from '@rollingversions/change-set';
import VersionNumber, {
  increment,
  lt,
  normalize,
} from '@rollingversions/version-number';
import {parseTag, printTag} from '@rollingversions/tag-format';

const MAX_VERSION_SCHEMA_LENGTH = 16;
const MAX_KEY_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 64;
const MAX_TAG_FORMAT_LENGTH = 64;

const DEFAULT_VERSION_SCHEMA: VersionSchema = ['MAJOR', 'MINOR', 'PATCH'];
const DEFAULT_CHANGE_TYPES = [
  ct('breaking', 'MAJOR', 'Breaking Changes'),
  ct('feat', 'MINOR', 'New Features'),
  ct('refactor', 'MINOR', 'Refactors'),
  ct('perf', 'PATCH', 'Performance Improvements'),
  ct('fix', 'PATCH', 'Bug Fixes'),
];
const DEFAULT_BASE_VERSION = (vs: VersionSchema): readonly number[] =>
  vs.map((_, i) => (i === 0 ? 1 : 0));

export type VersionBumpType = string & {__brand?: 'VersionBumpType'};
export type VersionSchema = readonly [
  VersionBumpType,
  ...(readonly VersionBumpType[])
];

export interface ChangeType extends ChangeTypeBase {
  readonly bumps: VersionBumpType | null;
}

export interface RollingConfigOptions {
  readonly tagFormat?: string;
  readonly changeTypes?: readonly ChangeType[];
  readonly versionSchema?: VersionSchema;
  readonly baseVersion?: readonly number[];
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
  .withConstraint(
    ({
      changeTypes = DEFAULT_CHANGE_TYPES,
      versionSchema = DEFAULT_VERSION_SCHEMA,
      baseVersion = DEFAULT_BASE_VERSION(versionSchema),
    }) => {
      if (baseVersion.length !== versionSchema.length) {
        return `If you specify a custom versionSchema and a custom baseVersion, they must be the same length.`;
      }
      const parts = new Set(versionSchema);
      const changeTypeWithMissingBump = changeTypes.find(
        (changeType) =>
          changeType.bumps !== null && !parts.has(changeType.bumps),
      );
      if (changeTypeWithMissingBump) {
        return `The change type "${changeTypeWithMissingBump.id}" is set to bump "${changeTypeWithMissingBump.bumps}" but that string does not exist in the versionSchema. Set bumps to null if you don't want changes of this type to trigger a release.`;
      }
      return true;
    },
    {name: 'RollingConfigOptions'},
  );

export function parseRollingConfigOptions(
  value: unknown,
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

export default class RollingConfig {
  private readonly _tagFormat: string | undefined;
  private readonly _versionSchema: VersionSchema;
  public readonly changeTypes: readonly ChangeType[];

  private readonly _bumps: Pick<Map<ChangeTypeID, number>, 'get'>;
  private readonly _baseVersion: VersionNumber;

  constructor({
    tagFormat,
    changeTypes = DEFAULT_CHANGE_TYPES,
    versionSchema = DEFAULT_VERSION_SCHEMA,
    baseVersion = DEFAULT_BASE_VERSION(versionSchema),
  }: RollingConfigOptions) {
    this._tagFormat = tagFormat;
    this._versionSchema = versionSchema;
    this.changeTypes = changeTypes;
    this._bumps = new Map(
      changeTypes.map((ct) => [
        ct.id,
        ct.bumps !== null ? versionSchema.indexOf(ct.bumps) : -1,
      ]),
    );
    this._baseVersion = {numerical: baseVersion, prerelease: [], build: []};
  }

  public printTag(
    version: VersionNumber,
    {
      packageName,
      oldTagName,
    }: {
      packageName: string;
      oldTagName: string | null;
    },
  ): string {
    return printTag(version, {
      packageName,
      oldTagName,
      tagFormat: this._tagFormat,
      versionSchema: this._versionSchema,
    });
  }

  public parseTag(
    tagName: string,
    {
      packageName,
      allowTagsWithoutPackageName,
    }: {
      packageName: string;
      allowTagsWithoutPackageName: boolean;
    },
  ): VersionNumber | null {
    return parseTag(tagName, {
      allowTagsWithoutPackageName,
      packageName,
      tagFormat: this._tagFormat,
      versionSchema: this._versionSchema,
    });
  }

  public normalizeVersionNumber(versionNumber: VersionNumber): VersionNumber {
    return normalize(versionNumber, this._versionSchema.length);
  }

  public getNextVersionNumber(
    currentVersionNumber: VersionNumber | null,
    changeSet: ChangeSet,
  ) {
    let minIndex = -1;
    for (const c of changeSet) {
      const bump = this._bumps.get(c.type) ?? -1;
      if (bump !== -1 && (minIndex === -1 || minIndex > bump)) {
        minIndex = bump;
      }
    }

    if (minIndex === -1) {
      return null;
    }

    if (
      currentVersionNumber === null ||
      lt(currentVersionNumber, this._baseVersion)
    ) {
      return this._baseVersion;
    }

    return increment(
      normalize(currentVersionNumber, this._versionSchema.length),
      minIndex,
    );
  }
}
