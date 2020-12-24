import {
  t,
  compressedObjectCodec,
  map,
} from 'rollingversions/lib/utils/ValidationCodec';
import {ChangeSet, ChangeSetCodec} from 'rollingversions/lib/types/ChangeSet';
import Permission, {PermissionCodec} from './server/permissions/Permission';
import PackageManifest, {
  PackageManifestCodec,
} from 'rollingversions/lib/types/PackageManifest';

export interface RepoResponse {
  headSha: string | null;
  packages: readonly {
    pkg: PackageManifest;
    currentVersion: string | null;
    changeSet: ChangeSet<{pr: number}>;
  }[];
  cycleDetected: readonly string[] | null;
}

export interface PullRequestPackage {
  pkg: PackageManifest;
  currentVersion: string | null;
  changeSet: ChangeSet; // <{id: number; weight: number}>;
  released: boolean;
}
export type PullRequestPackages = Map<string, PullRequestPackage>;

const PullRequestPackagesCodec = map(
  t.String,
  compressedObjectCodec(
    1,
    'PullRequestPackage',
    {
      pkg: PackageManifestCodec,
      currentVersion: t.Union(t.String, t.Null),
      changeSet: ChangeSetCodec,
      released: t.Boolean,
    },
    ['pkg', 'currentVersion', 'changeSet', 'released'],
  ),
);

export interface PullRequestResponse {
  headSha: string | null;
  permission: Permission;
  closed: boolean;
  merged: boolean;
  packages: PullRequestPackages;
}

export const PullRequestResponse: t.Codec<PullRequestResponse> = compressedObjectCodec(
  2,
  'PullRequestResponse',
  {
    headSha: t.Union(t.Null, t.String),
    permission: PermissionCodec,
    closed: t.Boolean,
    merged: t.Boolean,
    packages: PullRequestPackagesCodec,
  },
  ['headSha', 'permission', 'closed', 'merged', 'packages'],
);

export interface UpdatePullRequestBody {
  headSha: string | null;
  updates: {packageName: string; changes: ChangeSet}[];
}

export const UpdatePullRequestBody: t.Codec<UpdatePullRequestBody> = compressedObjectCodec(
  1,
  'UpdatePullRequestBody',
  {
    headSha: t.Union(t.String, t.Null),
    updates: t.Array(
      compressedObjectCodec(
        1,
        'Updates',
        {
          packageName: t.String,
          changes: ChangeSetCodec,
        },
        ['packageName', 'changes'],
      ),
    ),
  },
  ['headSha', 'updates'],
);
