import {t} from '../utils/ValidationCodec';
import PublishConfigAccess, {
  PublishConfigAccessCodec,
} from './PublishConfigAccess';

// N.B. this enum **must** be kept in sync with the publish_targets table in the database
enum PublishTarget {
  npm = 'npm',
  custom_script = 'custom_script',
}
export default PublishTarget;

export interface NpmPublishTargetConfig {
  type: PublishTarget.npm;
  publishConfigAccess: PublishConfigAccess;
}
export const NpmPublishTargetConfig: t.Codec<NpmPublishTargetConfig> = t.Object(
  {
    type: t.Literal(PublishTarget.npm),
    publishConfigAccess: PublishConfigAccessCodec,
  },
);

export interface CustomScriptTargetConfig {
  type: PublishTarget.custom_script;
  version?: string;
  prepublish?: string;
  publish_dry_run?: string;
  publish: string;
}
export const CustomScriptTargetConfig: t.Codec<CustomScriptTargetConfig> = t
  .Object({
    type: t.Literal(PublishTarget.custom_script),
    publish: t.String,
  })
  .And(
    t.Partial({
      version: t.String,
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
