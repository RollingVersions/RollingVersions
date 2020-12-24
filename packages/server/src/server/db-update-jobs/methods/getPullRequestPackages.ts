import {
  PackageDependencies,
  ChangeSet,
  PackageManifestWithVersion,
} from 'rollingversions/lib/types';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import addPackageVersions from 'rollingversions/lib/utils/addPackageVersions';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbGitCommit from '@rollingversions/db/git_commits';
import {getRegistryVersion} from '../../PublishTargets';
import {
  getPackageManifests,
  PackageManifests,
} from '../../models/PackageManifests';
import ServerContext, {NonTransactionContext} from '../../ServerContext';
import {PullRequestWithHeadCommit} from '../../models/PullRequests';
import {getBranch, getTags} from '../../models/GitReference';
import {isPullRequestReleased} from '../../models/Commits';
import {getChangesForPullRequest} from '../../models/ChangeLogEntry';

export interface PullRequestPackage {
  manifests: PackageManifestWithVersion[];
  dependencies: PackageDependencies;
  changeSet: ChangeSet<{id: number; weight: number}>;
  released: boolean;
}

export default async function getPullRequestPackages(
  ctx: NonTransactionContext,
  repo: DbGitRepository,
  pr: PullRequestWithHeadCommit,
) {
  const tagsPromise = getTags(ctx, repo);
  tagsPromise.catch(() => {
    // error handled later
  });

  const [changes, packages] = await Promise.all([
    ctx.withLogging(getChangesForPullRequest(ctx, pr.id), {
      success: 'got_changes_for_pr',
      successMessage: 'Got changes for pull request',
      failure: 'failed_get_changes',
    }),
    ctx
      .withLogging(getPackageManifestsForPr(ctx, repo, pr.headCommit), {
        success: 'got_package_manifests_for_pr',
        successMessage: 'Got package manifests for pr',
        failure: 'failed_get_package_manifests_for_pr',
      })
      .then(async (packages) =>
        ctx.withLogging(
          addPackageVersions(packages, await tagsPromise, (pkg) =>
            getRegistryVersion(ctx, pkg),
          ),
          {
            success: 'got_package_versions',
            successMessage: 'Got package versions',
            failure: 'failed_get_package_versions',
          },
        ),
      ),
  ]);

  const changeSets = new Map<string, ChangeSet<{id: number; weight: number}>>();
  for (const change of changes) {
    let changeSet = changeSets.get(change.package_name);
    if (!changeSet) {
      changeSet = getEmptyChangeSet();
      changeSets.set(change.package_name, changeSet);
    }
    changeSet[change.kind].push({
      id: change.id,
      weight: change.sort_order_weight,
      title: change.title,
      body: change.body,
    });
  }

  const missingPackages = [
    ...new Set(
      changes.map((c) => c.package_name).filter((pn) => !packages.has(pn)),
    ),
  ].map((packagName): [
    string,
    {
      manifests: PackageManifestWithVersion[];
      dependencies: PackageDependencies;
    },
  ] => [
    packagName,
    {
      manifests: [],
      dependencies: {required: [], optional: [], development: []},
    },
  ]);

  const tags = await tagsPromise;

  return new Map<string, PullRequestPackage>(
    await Promise.all(
      [...packages, ...missingPackages].map(
        async ([packageName, metadata]): Promise<
          [string, PullRequestPackage]
        > => {
          return [
            packageName,
            {
              ...metadata,
              changeSet: changeSets.get(packageName) || getEmptyChangeSet(),
              released:
                pr.is_merged &&
                (await isPullRequestReleased(ctx, {
                  releasedCommitIDs: [
                    ...new Set(
                      metadata.manifests
                        .map(({versionTag}) => {
                          if (!versionTag) return undefined;
                          return tags.find(
                            (t2) => t2.name === versionTag?.name,
                          );
                        })
                        .filter(isTruthy)
                        .map((versionTag) => versionTag.target_git_commit_id),
                    ),
                  ],
                  pullRequestID: pr.id,
                })),
            },
          ];
        },
      ),
    ),
  );
}

async function getPackageManifestsForPr(
  ctx: ServerContext,
  repo: DbGitRepository,
  head: DbGitCommit | null,
): Promise<PackageManifests> {
  if (head) {
    // TODO: only use this head if the PR is open
    // (once we are able to display changes on packages that no longer exist)
    return getPackageManifests(ctx, head.id);
  }
  const defaultBranch = await getBranch(ctx, repo, repo.default_branch_name);
  if (defaultBranch) {
    return getPackageManifests(ctx, defaultBranch.target_git_commit_id);
  }
  // TODO: report this error to users
  ctx.throw(
    `failed_package_manifset_load`,
    'Could not find package manifests for this pull request',
  );
}
