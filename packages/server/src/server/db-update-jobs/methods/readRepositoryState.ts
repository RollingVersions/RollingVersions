import {Repository} from 'rollingversions/lib/types';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import addPackageVersions from 'rollingversions/lib/utils/addPackageVersions';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import {
  getCurrentVerion,
  getNewVersion,
} from 'rollingversions/lib/utils/Versioning';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import {PackageStatusDetail} from 'rollingversions/lib/utils/getPackageStatuses';
import DbGitRepository from '@rollingversions/db/git_repositories';
import {getRegistryVersion} from '../../PublishTargets';
import {getPackageManifests} from '../../models/PackageManifests';
import {NonTransactionContext} from '../../ServerContext';
import {upsertRepositoryFromName} from '../../models/Repository';
import {getBranch, getTags} from '../../models/GitReference';
import {getAllUnreleasedChanges} from '../../models/Commits';

export default async function readRepositoryState(
  ctx: NonTransactionContext,
  repository: Repository,
) {
  const repo = await upsertRepositoryFromName(ctx, repository);

  if (!repo) return null;

  return await readBranchState(ctx, repo, repo.default_branch_name);
}
export async function readBranchState(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  branchName: string,
) {
  const tagsPromise = getTags(ctx, repo);
  tagsPromise.catch(() => {
    // error handled later
  });

  const branch = await getBranch(ctx, repo, branchName);
  if (!branch) {
    return null;
  }

  const packages = await getPackageManifests(
    ctx,
    branch.target_git_commit_id,
  ).then(async (packages) =>
    addPackageVersions(packages, await tagsPromise, (pkg) =>
      getRegistryVersion(ctx, pkg),
    ),
  );

  const packageStatuses = await Promise.all(
    [...packages].map(
      async ([
        packageName,
        {manifests, dependencies},
      ]): Promise<PackageStatusDetail> => {
        const currentVersion = getCurrentVerion(manifests);
        const currentTag = currentVersion
          ? manifests.find(
              (manifest) => manifest.versionTag?.version === currentVersion,
            )?.versionTag
          : null;
        if (currentVersion && !currentTag) {
          return {
            status: PackageStatus.MissingTag,
            packageName,
            currentVersion,
            manifests: manifests,
            dependencies,
          };
        }

        const releasedIDs = new Set(
          manifests
            .map((m) => m.versionTag?.target_git_commit_id)
            .filter(isTruthy),
        );
        const changeSet = getEmptyChangeSet<{
          id: number;
          weight: number;
          pr: number;
        }>();
        for (const change of await getAllUnreleasedChanges(ctx, {
          headCommitID: branch.target_git_commit_id,
          lastReleaseCommitIDs: [...releasedIDs],
        })) {
          if (change.package_name === packageName) {
            changeSet[change.kind].push({
              id: change.id,
              weight: change.sort_order_weight,
              title: change.title,
              body: change.body,
              pr: change.pr_number,
            });
          }
        }
        const newVersion = getNewVersion(currentVersion, changeSet);
        if (!newVersion) {
          return {
            status: PackageStatus.NoUpdateRequired,
            currentVersion,
            newVersion: currentVersion,
            packageName,
            manifests: manifests,
            dependencies,
          };
        }

        return {
          status: PackageStatus.NewVersionToBePublished,
          currentVersion,
          newVersion,
          packageName,
          changeSet,
          manifests: manifests,
          dependencies,
        };
      },
    ),
  );
  return {branch, packageStatuses};
}
