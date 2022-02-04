import * as t from 'funtypes';

import {PublishConfigAccessCodec} from './PublishConfigAccess';
import {TagFormatCodec} from './Strings';

// N.B. this enum **must** be kept in sync with the publish_targets table in the database
enum PublishTarget {
  custom = 'custom',
  docker = 'docker',
  npm = 'npm',
}
export default PublishTarget;

export const NpmRegistryCodec = t.Named(
  `NpmRegistry`,
  t.Intersect(
    t.Object({url: t.String, token_env: t.String}),
    t.Partial({
      package_overrides: t.Record(t.String, t.Unknown),
    }),
  ),
);
export type NpmRegistry = t.Static<typeof NpmRegistryCodec>;
export const NpmPublishTargetConfigCodec = t.Named(
  `NpmPublishTarget`,
  t.Intersect(
    t.Readonly(
      t.Object({
        type: t.Literal(PublishTarget.npm),
        /**
         * The filename of the package.json file
         */
        path: t.String,
        /**
         * The "name" field in package.json
         */
        packageName: t.String,
        /**
         * The "private" field in package.json (defaults to false)
         */
        private: t.Boolean,
        /**
         * The "publishConfig"."access" field in package.json (defaults to "restricted" if package name stars with "@", otherwise defaults to "public")
         */
        publishConfigAccess: PublishConfigAccessCodec,
      }),
    ),
    t.Readonly(
      t.Partial({
        registry: NpmRegistryCodec,
      }),
    ),
  ),
);

export const ScriptCodec = t.Intersect(
  t.Readonly(t.Object({command: t.String})),
  t.Readonly(t.Partial({directory: t.String})),
);
export const CustomTargetConfigCodec = t.Named(
  `CustomTarget`,
  t.Intersect(
    t.Readonly(
      t.Object({
        type: t.Literal(PublishTarget.custom),
      }),
    ),
    t.Readonly(
      t.Partial({
        /**
         * The command to run in order to publish a new version of the package
         */
        release: ScriptCodec,
        /**
         * A command to run instead of `release` when in dry run mode
         */
        release_dry_run: ScriptCodec,
      }),
    ),
  ),
);

export const DockerTargetConfigCodec = t.Named(
  `DockerTarget`,
  t.Readonly(
    t.Object({
      type: t.Literal(PublishTarget.docker),
      image_name: t.Object({local: t.String, remote: t.String}),
      docker_tag_formats: t.Array(TagFormatCodec),
    }),
  ),
);

export const PublishTargetConfigCodec = t.Named(
  `PublishTarget`,
  t.Union(
    CustomTargetConfigCodec,
    DockerTargetConfigCodec,
    NpmPublishTargetConfigCodec,
  ),
);

export type PublishTargetConfig = t.Static<typeof PublishTargetConfigCodec>;
