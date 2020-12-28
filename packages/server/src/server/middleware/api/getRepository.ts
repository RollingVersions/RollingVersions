import {getBranch} from 'rollingversions/lib/services/github';
import sortPackages from 'rollingversions/lib/utils/sortPackages';
import {Repository} from 'rollingversions/lib/types';
import {RepoResponse} from '../../../types';
import readRepositoryState from '../../db-update-jobs/methods/readRepositoryState';
import {db} from '../../services/postgres';
import {GitHubClient} from '../../services/github';
import {Logger} from '../../logger';
import PackageStatus from 'rollingversions/src/types/PackageStatus';
import isTruthy from 'rollingversions/src/ts-utils/isTruthy';

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
