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
}

export const PullRequestResponseCodec = new ValidationCodec(
  compressedObjectCodec(
    1,
    'PullRequestResponse',
    {
      permission: PermissionCodec,
      closed: t.boolean,
      merged: t.boolean,
      changeLogState: t.union([t.null, PullRequestStateCodec]),
    },
    [versionSymbol, 'permission', 'closed', 'merged', 'changeLogState'],
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
