import {
  t,
  compressedObjectCodec,
  map,
} from 'rollingversions/lib/utils/ValidationCodec';
import {
  ChangeSet,
  ChangeSetCodec,
} from 'rollingversions/lib/types/PullRequestState';
import Permission, {PermissionCodec} from './server/permissions/Permission';
import {PackageDependencies} from 'rollingversions/lib/types';
import {PackageManifestWithVersion} from 'rollingversions/lib/types/PackageManifest';
import {PackageDependenciesCodec} from 'rollingversions/lib/types/PackageDependencies';

export interface RepoResponse {
  headSha: string | null;
  packagesWithChanges: readonly {
    packageName: string;
    changeSet: ChangeSet<{pr: number}>;
    currentVersion: string | null;
    newVersion: string;
  }[];
  packagesWithNoChanges: readonly {
    packageName: string;
    currentVersion: string | null;
  }[];
  cycleDetected: readonly string[] | null;
}

export interface PullRequestPackage {
  manifests: PackageManifestWithVersion[];
  dependencies: PackageDependencies;
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
      manifests: t.Array(PackageManifestWithVersion),
      dependencies: PackageDependenciesCodec,
      changeSet: ChangeSetCodec,
      released: t.Boolean,
    },
    ['manifests', 'dependencies', 'changeSet', 'released'],
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
