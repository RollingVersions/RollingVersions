import ValidationCodec, {
  t,
  compressedObjectCodec,
  versionSymbol,
  map,
} from 'rollingversions/lib/utils/ValidationCodec';
import {
  ChangeSet,
  ChangeSetCodec,
} from 'rollingversions/lib/types/PullRequestState';
import Permission, {PermissionCodec} from './server/permissions/Permission';
import {PackageStatusDetail} from 'rollingversions/lib/utils/getPackageStatuses';
import {
  PackageManifestWithVersion,
  PackageDependencies,
} from 'rollingversions/lib/types';
import {PackageManifestWithVersionCodec} from 'rollingversions/lib/types/PackageManifest';
import {PackageDependenciesCodec} from 'rollingversions/lib/types/PackageDependencies';

export interface RepoResponse {
  headSha: string | null;
  packages: readonly PackageStatusDetail[];
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
  t.string,
  compressedObjectCodec<PullRequestPackage>()(
    1,
    'PullRequestPackage',
    {
      manifests: t.array(PackageManifestWithVersionCodec),
      dependencies: PackageDependenciesCodec,
      changeSet: ChangeSetCodec,
      released: t.boolean,
    },
    [versionSymbol, 'manifests', 'dependencies', 'changeSet', 'released'],
  ),
);

export interface PullRequestResponse {
  headSha: string | null;
  permission: Permission;
  closed: boolean;
  merged: boolean;
  packages: PullRequestPackages;
}

export const PullRequestResponseCodec = new ValidationCodec(
  compressedObjectCodec<PullRequestResponse>()(
    2,
    'PullRequestResponse',
    {
      headSha: t.union([t.null, t.string]),
      permission: PermissionCodec,
      closed: t.boolean,
      merged: t.boolean,
      packages: PullRequestPackagesCodec,
    },
    [versionSymbol, 'headSha', 'permission', 'closed', 'merged', 'packages'],
  ),
);

export interface UpdatePullRequestBody {
  headSha: string | null;
  updates: {packageName: string; changes: ChangeSet}[];
}

export const UpdatePullRequestBodyCodec = new ValidationCodec(
  compressedObjectCodec<UpdatePullRequestBody>()(
    1,
    'UpdatePullRequestBody',
    {
      headSha: t.union([t.string, t.null]),
      updates: t.array(
        compressedObjectCodec<{packageName: string; changes: ChangeSet}>()(
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
