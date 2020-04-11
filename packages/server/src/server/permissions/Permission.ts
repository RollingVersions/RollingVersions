import {t} from 'rollingversions/lib/utils/ValidationCodec';

type Permission = 'none' | 'view' | 'edit';

export default Permission;

export const PermissionCodec = t.union([
  t.literal('none'),
  t.literal('view'),
  t.literal('edit'),
]);
