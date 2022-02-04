import * as t from 'funtypes';

import {
  BaseVersionCodec,
  ChangeType,
  ChangeTypeCodec,
  ChangeTypeID,
  PublishTarget,
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

const GLOBAL_SCRIPTS = {
  /**
   * If you want to perform any extra checks before releasing,
   * you can use the "pre_release" script. For example, you
   * could use this to build your package if you want to avoid
   * building the package when there are no changes to release.
   *
   * The "pre_release" script is run even in "--dry-run" mode,
   * but it is not run if there are no changes to release.
   */
  pre_release: t.String,
  /**
   * The "post_release" script is run after publishing your
   * package and creating a release in GitHub. You could use
   * this to post to slack or send e-mails announcing the release.
   * You could even use this to deploy your new packages to servers.
   */
  post_release: t.String,
};
const GLOBAL_OPTIONS = {
  tag_format: TagFormatCodec,
  change_types: t.ReadonlyArray(ChangeTypeCodec),
  versioning_mode: VersioningModeCodec,
  version_schema: VersionSchemaCodec,
  base_version: BaseVersionCodec,
};

const CustomPackageCodec = t.Named(
  `CustomPackage`,
  t.Intersect(
    t.Object({type: t.Literal(PublishTarget.custom), name: t.String}),
    t.Partial({
      ...GLOBAL_OPTIONS,
      scripts: t.Partial({
        ...GLOBAL_SCRIPTS,
        release_dry_run: t.String,
        release: t.String,
      }),
      dependencies: t.Array(t.String),
    }),
  ),
);

const DockerPackageCodec = t.Named(
  `DockerPackage`,
  t.Intersect(
    t.Object({type: t.Literal(PublishTarget.docker), name: t.String}),
    t.Partial({
      ...GLOBAL_OPTIONS,

      /**
       * The image name if it is different from the package name in Rolling Versions.
       * You can optionally include a tag for the "local" image, otherwise it will
       * default to ":latest".
       */
      image_name: t.Union(
        t.String,
        t.Partial({local: t.String, remote: t.String}),
      ),
      /**
       * The tags to push. By default we push:
       *
       * - latest
       * - {MAJOR}
       * - {MAJOR}.{MINOR}
       * - {MAJOR}.{MINOR}.{PATCH}
       */
      docker_tag_formats: t.Array(TagFormatCodec),
      scripts: t.Partial(GLOBAL_SCRIPTS),
      dependencies: t.Array(t.String),
    }),
  ),
);

const NpmPackageCodec = t.Named(
  `NpmPackage`,
  t.Intersect(
    t.Object({
      type: t.Literal(PublishTarget.npm),
      /**
       * The path to the `package.json` file. Can include wildcards like `*`
       */
      path: t.String,
    }),
    t.Partial({
      ...GLOBAL_OPTIONS,
      /**
       * Name in Rolling Versions if different from in package.json
       */
      name: t.String,
      /**
       * Packages to treat as dependencies even though they are not in package.json
       */
      dependencies: t.Array(t.String),
      scripts: t.Partial(GLOBAL_SCRIPTS),
    }),
  ),
);

const PackageConfigCodec = t.Union(
  CustomPackageCodec,
  DockerPackageCodec,
  NpmPackageCodec,
);
export type PackageConfig = t.Static<typeof PackageConfigCodec>;
export interface RollingConfig extends RollingConfigOptions {
  readonly packages: readonly PackageConfig[];
  readonly release_trigger?: ReleaseTrigger;
}

export function completeConfig<TObject extends Partial<RollingConfigOptions>>(
  object: TObject,
  defaults: RollingConfigOptions,
): t.Result<{
  readonly options: RollingConfigOptions;
  readonly customized: readonly (keyof RollingConfigOptions)[];
  readonly rest: Omit<TObject, keyof RollingConfigOptions>;
}> {
  const {
    tag_format = defaults.tag_format,
    change_types = defaults.change_types,
    versioning_mode = defaults.versioning_mode,
    version_schema = defaults.version_schema,
    base_version = version_schema !== defaults.version_schema
      ? DEFAULT_BASE_VERSION(version_schema)
      : defaults.base_version,
    ...rest
  } = object;
  if (base_version.length !== version_schema.length) {
    return {
      success: false,
      message: `If you specify a custom versionSchema and a custom baseVersion, they must be the same length.`,
    };
  }
  const parts = new Set(version_schema);
  const changeTypeWithMissingBump = change_types.find(
    (changeType) => changeType.bumps !== null && !parts.has(changeType.bumps),
  );
  if (changeTypeWithMissingBump) {
    return {
      success: false,
      message: `The change type "${changeTypeWithMissingBump.id}" is set to bump "${changeTypeWithMissingBump.bumps}" but that string does not exist in the versionSchema. Set bumps to null if you don't want changes of this type to trigger a release.`,
    };
  }

  const options = {
    tag_format,
    change_types,
    versioning_mode,
    version_schema,
    base_version,
  };

  return {
    success: true,
    value: {
      options,
      rest,
      customized: ([
        `tag_format`,
        `change_types`,
        `versioning_mode`,
        `version_schema`,
        `base_version`,
      ] as const).filter(
        (key) => options[key] !== defaults[key] || object[key] !== undefined,
      ),
    },
  };
}

const ReleaseTriggerCodec = t.Named(
  `GitHubDispatchTrigger`,
  t.Readonly(
    t.Object({
      type: t.Literal(`github_workflow_trigger`),
      name: t.String,
    }),
  ),
);
export type ReleaseTrigger = t.Static<typeof ReleaseTriggerCodec>;
const RollingConfigCodec: t.Codec<RollingConfig> = t.Named(
  `RollingConfig`,
  t
    .Intersect(
      t.Object({packages: t.Array(PackageConfigCodec)}),
      t.Partial({...GLOBAL_OPTIONS, release_trigger: ReleaseTriggerCodec}),
    )
    .withParser<RollingConfig>({
      parse(config) {
        const result = completeConfig(config, DEFAULT_CONFIG);
        if (result.success) {
          const {rest, options} = result.value;
          return {success: true, value: {...options, ...rest}};
        }
        return result;
      },
    }),
);

const RollingConfigOptionsCodec: t.Codec<RollingConfigOptions> = t
  .Partial(GLOBAL_OPTIONS)
  .withParser({
    parse: (options): t.Result<RollingConfigOptions> => {
      const result = completeConfig(options, DEFAULT_CONFIG);
      if (result.success) {
        const {options} = result.value;
        return {success: true, value: options};
      }
      return result;
    },
    name: 'RollingConfigOptions',
  });

export const DEFAULT_CONFIG: RollingConfigOptions = {
  tag_format: undefined,
  change_types: DEFAULT_CHANGE_TYPES,
  versioning_mode: VersioningMode.Unambiguous,
  version_schema: DEFAULT_VERSION_SCHEMA,
  base_version: DEFAULT_BASE_VERSION(DEFAULT_VERSION_SCHEMA),
};

export function parseRollingConfigOptions(
  value: Partial<{[key in keyof RollingConfigOptions]: unknown}>,
):
  | {success: true; value: RollingConfigOptions}
  | {success: false; reason: string} {
  const res = RollingConfigOptionsCodec.safeParse(value);
  return res.success ? res : {success: false, reason: t.showError(res)};
}

export function parseRollingConfig(
  value: unknown,
): {success: true; value: RollingConfig} | {success: false; reason: string} {
  const res = RollingConfigCodec.safeParse(value);
  return res.success ? res : {success: false, reason: t.showError(res)};
}

function ct(
  id: ChangeTypeID,
  bumps: VersionBumpType,
  plural: string,
): ChangeType {
  return {id, bumps, plural};
}
