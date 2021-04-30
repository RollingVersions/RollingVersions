import db from '@rollingversions/db';
import sortPackagesByDependencies from '@rollingversions/sort-by-dependencies';
import {getNextVersion} from '@rollingversions/version-number';
import {GetRepositoryApiResponse} from 'rollingversions/lib/types/ApiResponse';

import type {Logger} from '../../logger';
import {getBranchHeadCommit, getAllTags} from '../../models/git';
import {getDetailedPackageManifestsForBranch} from '../../models/PackageManifests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';

export default async function getRepositoryForCli(
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
): Promise<GetRepositoryApiResponse | null> {
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
    branchName,
    allTagNames: (await getAllTags(db, client, repo, logger)).map(
      (t) => t.name,
    ),
    packages: packages.map((p) => ({
      manifest: p.manifest,
      changeSet: p.changeSet,
      newVersion: getNextVersion(
        p.manifest.versionTag?.version ?? null,
        p.changeSet,
      ),
    })),
    cycleDetected: sortResult.circular ? sortResult.packageNames : null,
  };
}
