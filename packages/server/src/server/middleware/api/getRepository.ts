import ChangeSet from '@rollingversions/change-set';
import db from '@rollingversions/db';
import sortPackagesByDependencies from '@rollingversions/sort-by-dependencies';
import {
  ApiPackageResponse,
  GetRepositoryApiResponse,
} from '@rollingversions/types';
import {getNextVersion} from '@rollingversions/version-number';

import type {Logger} from '../../logger';
import {
  getBranchHeadCommit,
  getAllTags,
  getCommitBySha,
  getAllTagsOnBranch,
  getUnreleasedChanges,
  getAllBranches,
} from '../../models/git';
import {
  getCurrentVersion,
  getPackageManifests,
  getPackageVersions,
} from '../../models/PackageManifests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';

export default async function getRepository(
  client: GitHubClient,
  repository: {
    owner: string;
    name: string;
  },
  {commit, branch}: {commit?: string; branch?: string},
  logger: Logger,
): Promise<GetRepositoryApiResponse | null> {
  const repo = await getRepositoryFromRestParams(db, client, repository);
  if (!repo) return null;

  const [
    requestedHeadCommit,
    defaultBranchHeadCommit,
    deployBranchHeadCommit,
  ] = await Promise.all([
    commit ? getCommitBySha(db, client, repo, commit, logger) : null,
    getBranchHeadCommit(db, client, repo, repo.default_branch_name, logger),
    branch ? getBranchHeadCommit(db, client, repo, branch, logger) : null,
  ]);
  if (commit && !requestedHeadCommit) {
    return null;
  }
  if (branch && !deployBranchHeadCommit) {
    return null;
  }
  const headCommit =
    requestedHeadCommit ?? deployBranchHeadCommit ?? defaultBranchHeadCommit;
  if (!headCommit) {
    return null;
  }

  const [
    allBranches,
    allTags,
    branchTags,
    getPackageManifestsResult,
  ] = await Promise.all([
    getAllBranches(db, client, repo, logger),
    getAllTags(db, client, repo, logger),
    getAllTagsOnBranch(db, headCommit),
    getPackageManifests(
      db,
      client,
      repo,
      {type: 'commit', commit: headCommit},
      logger,
    ),
  ]);

  if (!getPackageManifestsResult) return null;

  const {packages: packagesByName, packageErrors} = getPackageManifestsResult;

  const sortResult = sortPackagesByDependencies(
    packagesByName,
    (pkg) => pkg.dependencies,
  );

  const packages = sortResult.circular
    ? [...packagesByName.values()].sort((a, b) =>
        a.packageName < b.packageName ? -1 : 1,
      )
    : sortResult.packages;

  return {
    headSha: headCommit.commit_sha,
    defaultBranch: {
      name: repo.default_branch_name,
      headSha: defaultBranchHeadCommit?.commit_sha ?? null,
    },
    deployBranch: branch
      ? {
          name: branch,
          headSha: deployBranchHeadCommit?.commit_sha ?? null,
        }
      : {
          name: repo.default_branch_name,
          headSha: defaultBranchHeadCommit?.commit_sha ?? null,
        },
    allBranchNames: allBranches.map((b) => b.name),
    allTagNames: allTags.map((t) => t.name),
    packages: await Promise.all(
      packages.map(
        async (manifest, _, manifests): Promise<ApiPackageResponse> => {
          const allVersions = getPackageVersions({
            allowTagsWithoutPackageName: manifests.length <= 1,
            allTags,
            manifest,
          });
          const branchVersions = getPackageVersions({
            allowTagsWithoutPackageName: manifests.length <= 1,
            allTags: branchTags,
            manifest,
          });
          const currentVersion = getCurrentVersion({
            allVersions,
            branchVersions,
            versioningMode: manifest.versioningMode,
            branchName: branch ?? repo.default_branch_name,
          });
          const changeSet: ChangeSet<{pr: number}> = (
            await getUnreleasedChanges(db, repo, {
              packageName: manifest.packageName,
              headCommitSha: headCommit.commit_sha,
              releasedCommits: new Set(allVersions.map((v) => v.commitSha)),
            })
          )
            .sort((a, b) => a.sort_order_weight - b.sort_order_weight)
            .map((c) => ({
              type: c.kind,
              title: c.title,
              body: c.body,
              pr: c.pr_number,
            }));
          return {
            manifest,
            changeSet,
            currentVersion,
            newVersion: getNextVersion(
              currentVersion?.ok ? currentVersion.version : null,
              changeSet,
              {
                changeTypes: manifest.changeTypes,
                versionSchema: manifest.versionSchema,
                baseVersion: manifest.baseVersion,
              },
            ),
          };
        },
      ),
    ),
    cycleDetected: sortResult.circular ? sortResult.packageNames : null,
    packageErrors,
  };
}
