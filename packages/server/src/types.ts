import type ChangeSet from '@rollingversions/change-set';
import type VersionNumber from '@rollingversions/version-number';
import {PackageManifestWithVersion} from 'rollingversions/lib/types/PackageManifest';
import {ModernChangeSetCodec} from 'rollingversions/lib/types/PullRequestState';
import {
  t,
  compressedObjectCodec,
  map,
} from 'rollingversions/lib/utils/ValidationCodec';

import type Permission from './server/permissions/Permission';
import {PermissionCodec} from './server/permissions/Permission';

export interface RepoResponse {
  headSha: string | null;
  packagesWithChanges: readonly {
    packageName: string;
    changeSet: ChangeSet<{pr: number}>;
    currentVersion: VersionNumber | null;
    newVersion: VersionNumber;
  }[];
  packagesWithNoChanges: readonly {
    packageName: string;
    currentVersion: VersionNumber | null;
  }[];
  cycleDetected: readonly string[] | null;
}

export interface PullRequestPackage {
  manifest: PackageManifestWithVersion;
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
      manifest: PackageManifestWithVersion,
      changeSet: ModernChangeSetCodec,
      released: t.Boolean,
    },
    ['manifest', 'changeSet', 'released'],
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
          changes: ModernChangeSetCodec,
        },
        ['packageName', 'changes'],
      ),
    ),
  },
  ['headSha', 'updates'],
);
