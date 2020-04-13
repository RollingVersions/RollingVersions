import ValidationCodec, {
  t,
  compressedObjectCodec,
  versionSymbol,
} from 'rollingversions/lib/utils/ValidationCodec';
import PullRequestState, {
  PullRequestStateCodec,
  ChangeSet,
  ChangeSetCodec,
} from 'rollingversions/lib/types/PullRequestState';
import Permission, {PermissionCodec} from './server/permissions/Permission';

export interface PullRequestResponse {
  permission: Permission;
  closed: boolean;
  merged: boolean;
  changeLogState: null | PullRequestState;
  unreleasedPackages: string[];
}

export const PullRequestResponseCodec = new ValidationCodec(
  compressedObjectCodec(
    2,
    'PullRequestResponse',
    {
      permission: PermissionCodec,
      closed: t.boolean,
      merged: t.boolean,
      changeLogState: t.union([t.null, PullRequestStateCodec]),
      unreleasedPackages: t.array(t.string),
    },
    [
      versionSymbol,
      'permission',
      'closed',
      'merged',
      'changeLogState',
      'unreleasedPackages',
    ],
  ),
);

export interface UpdatePullRequestBody {
  headSha: string;
  updates: {packageName: string; changes: ChangeSet}[];
}

export const UpdatePullRequestBodyCodec = new ValidationCodec(
  compressedObjectCodec(
    1,
    'UpdatePullRequestBody',
    {
      headSha: t.string,
      updates: t.array(
        compressedObjectCodec(
          1,
          'Updates',
          {
            packageName: t.string,
            changes: ChangeSetCodec,
          },
          [versionSymbol, 'packageName', 'changes'],
        ),
      ),
    },
    [versionSymbol, 'headSha', 'updates'],
  ),
);
