import {t} from 'rollingversions/lib/utils/ValidationCodec';

type Permission = 'none' | 'view' | 'edit';

export default Permission;

export const PermissionCodec = t.Union(
  t.Literal('none'),
  t.Literal('view'),
  t.Literal('edit'),
);
