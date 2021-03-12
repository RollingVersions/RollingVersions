import {getBranch} from 'rollingversions/lib/services/github';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import type {Repository} from 'rollingversions/lib/types';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import sortPackages from 'rollingversions/lib/utils/sortPackages';

import type {RepoResponse} from '../../../types';
import readRepositoryState from '../../db-update-jobs/methods/readRepositoryState';
import type {Logger} from '../../logger';
import type {GitHubClient} from '../../services/github';
import {db} from '../../services/postgres';

export default async function getRepository(
  client: GitHubClient,
  repo: Repository,
  logger: Logger,
): Promise<RepoResponse> {
  const [branch, unsortedPackageStatuses] = await Promise.all([
    getBranch(client, repo),
    readRepositoryState(db, client, repo, logger),
  ] as const);

  const sortResult = await sortPackages(unsortedPackageStatuses);

  const packages = sortResult.circular
    ? unsortedPackageStatuses
    : sortResult.packages;

  return {
    headSha: branch?.headSha || null,
    packagesWithChanges: packages
      .map((pkg) =>
        pkg.status === PackageStatus.NewVersionToBePublished
          ? {
              packageName: pkg.packageName,
              changeSet: pkg.changeSet,
              currentVersion: pkg.currentVersion,
              newVersion: pkg.newVersion,
            }
          : null,
      )
      .filter(isTruthy),
    packagesWithNoChanges: packages
      .map((pkg) =>
        pkg.status === PackageStatus.NoUpdateRequired
          ? {
              packageName: pkg.packageName,
              currentVersion: pkg.currentVersion,
            }
          : null,
      )
      .filter(isTruthy),
    cycleDetected: sortResult.circular ? sortResult.packageNames : null,
  };
}
