import db from '@rollingversions/db';
import sortPackagesByDependencies from '@rollingversions/sort-by-dependencies';
import {getNextVersion} from '@rollingversions/version-number';

import type {RepoResponse} from '../../../types';
import type {Logger} from '../../logger';
import {getBranchHeadCommit} from '../../models/git';
import {getDetailedPackageManifestsForBranch} from '../../models/PackageManifests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';

export default async function getRepository(
  client: GitHubClient,
  repository: {
    owner: string;
    name: string;
  },
  {
    branch: customBranch,
    versionByBranch = false,
  }: {branch?: string; versionByBranch?: boolean},
  logger: Logger,
): Promise<RepoResponse | null> {
  const repo = await getRepositoryFromRestParams(db, client, repository);
  if (!repo) return null;

  const branchName = customBranch ?? repo.default_branch_name;
  const headCommit = await getBranchHeadCommit(
    db,
    client,
    repo,
    branchName,
    logger,
  );
  if (!headCommit) {
    return null;
  }

  const packagesByName = await getDetailedPackageManifestsForBranch(
    db,
    client,
    repo,
    {branchName, versionByBranch},
    logger,
  );
  if (!packagesByName) return null;

  const sortResult = sortPackagesByDependencies(
    packagesByName,
    (pkg) => pkg.manifest.dependencies,
  );

  const packages = sortResult.circular
    ? [...packagesByName.values()].sort((a, b) =>
        a.manifest.packageName < b.manifest.packageName ? -1 : 1,
      )
    : sortResult.packages;

  return {
    headSha: headCommit.commit_sha,
    packagesWithChanges: packages
      .filter(
        (p) =>
          getNextVersion(
            p.manifest.versionTag?.version ?? null,
            p.changeSet,
          ) !== null,
      )
      .map((p) => ({
        packageName: p.manifest.packageName,
        currentVersion: p.manifest.versionTag?.version ?? null,
        changeSet: p.changeSet,
        newVersion: getNextVersion(
          p.manifest.versionTag?.version ?? null,
          p.changeSet,
        )!,
      })),
    packagesWithNoChanges: packages
      .filter(
        (p) =>
          getNextVersion(
            p.manifest.versionTag?.version ?? null,
            p.changeSet,
          ) === null,
      )
      .map((p) => ({
        packageName: p.manifest.packageName,
        currentVersion: p.manifest.versionTag?.version ?? null,
        changeSet: p.changeSet,
      })),
    cycleDetected: sortResult.circular ? sortResult.packageNames : null,
  };
}
