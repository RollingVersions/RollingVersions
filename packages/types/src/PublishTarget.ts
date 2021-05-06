import * as t from 'funtypes';

import {PublishConfigAccessCodec} from './PublishConfigAccess';

// N.B. this enum **must** be kept in sync with the publish_targets table in the database
enum PublishTarget {
  npm = 'npm',
  custom_script = 'custom_script',
}
export default PublishTarget;

export const NpmPublishTargetConfigCodec = t.Named(
  `NpmPublishTarget`,
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
);
export type NpmPublishTargetConfig = t.Static<
  typeof NpmPublishTargetConfigCodec
>;

export const CustomScriptTargetConfigCodec = t.Named(
  `CustomScriptTarget`,
  t.Intersect(
    t.Readonly(
      t.Object({
        type: t.Literal(PublishTarget.custom_script),
        /**
         * The filename of the rolling-package.* file
         */
        path: t.String,
        /**
         * The command to run in order to publish a new version of the package
         */
        publish: t.String,
      }),
    ),
    t.Readonly(
      t.Partial({
        /**
         * A command to execute before publish/prepublish
         *
         * Use this to check permissions are configured correctly
         */
        prepublish: t.String,
        /**
         * A command to run instead of `publish` when in dry run mode
         *
         * Publish is never called in dry run
         */
        publish_dry_run: t.String,
      }),
    ),
  ),
);
export type CustomScriptTargetConfig = t.Static<
  typeof CustomScriptTargetConfigCodec
>;

export const PublishTargetConfigCodec = t.Named(
  `PublishTarget`,
  t.Union(NpmPublishTargetConfigCodec, CustomScriptTargetConfigCodec),
);

export type PublishTargetConfig = t.Static<typeof PublishTargetConfigCodec>;
