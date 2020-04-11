import {t} from '../utils/ValidationCodec';

enum PublishTarget {
  npm = 'npm',
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
