import {t} from '../utils/ValidationCodec';

enum PublishTarget {
  npm = 'npm',
  custom_script = 'custom_script',
}
export default PublishTarget;

export function isValidPublishTarget(value: unknown): value is PublishTarget {
  return Object.values(PublishTarget).includes(value as PublishTarget);
}

export const publishTargetCodec = new t.Type(
  'PublishTarget',
  isValidPublishTarget,
  (input, context) =>
    isValidPublishTarget(input) ? t.success(input) : t.failure(input, context),
  (v) => v,
);

export interface TargetConfig {
  [PublishTarget.npm]: {
    publishConfigAccess: 'restricted' | 'public';
  };
  [PublishTarget.custom_script]: {
    version?: string;
    prepublish?: string;
    publish_dry_run?: string;
    publish: string;
  };
}
