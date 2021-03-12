import {t} from '../utils/ValidationCodec';
import type PublishConfigAccess from './PublishConfigAccess';
import {PublishConfigAccessCodec} from './PublishConfigAccess';

// N.B. this enum **must** be kept in sync with the publish_targets table in the database
enum PublishTarget {
  npm = 'npm',
  custom_script = 'custom_script',
}
export default PublishTarget;

export interface NpmPublishTargetConfig {
  type: PublishTarget.npm;
  /**
   * The filename of the package.json file
   */
  path: string;
  /**
   * The "name" field in package.json
   */
  packageName: string;
  /**
   * The "private" field in package.json (defaults to false)
   */
  private: boolean;
  /**
   * The "publishConfig"."access" field in package.json (defaults to "restricted" if package name stars with "@", otherwise defaults to "public")
   */
  publishConfigAccess: PublishConfigAccess;
}
export const NpmPublishTargetConfig: t.Codec<NpmPublishTargetConfig> = t.Object(
  {
    type: t.Literal(PublishTarget.npm),
    path: t.String,
    packageName: t.String,
    private: t.Boolean,
    publishConfigAccess: PublishConfigAccessCodec,
  },
);

export interface CustomScriptTargetConfig {
  type: PublishTarget.custom_script;
  /**
   * The filename of the rolling-package.* file
   */
  path: string;
  /**
   * A command to execute before publish/prepublish
   *
   * Use this to check permissions are configured correctly
   */
  prepublish?: string;
  /**
   * A command to run instead of `publish` when in dry run mode
   *
   * Publish is never called in dry run
   */
  publish_dry_run?: string;
  /**
   * The command to run in order to publish a new version of the package
   */
  publish: string;
}

export const CustomScriptTargetConfig: t.Codec<CustomScriptTargetConfig> = t
  .Object({
    type: t.Literal(PublishTarget.custom_script),
    path: t.String,
    publish: t.String,
  })
  .And(
    t.Partial({
      prepublish: t.String,
      publish_dry_run: t.String,
    }),
  );

export type PublishTargetConfig =
  | NpmPublishTargetConfig
  | CustomScriptTargetConfig;

export const PublishTargetConfig = t.Union(
  NpmPublishTargetConfig,
  CustomScriptTargetConfig,
);
