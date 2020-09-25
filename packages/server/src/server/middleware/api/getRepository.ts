import {getBranch} from 'rollingversions/lib/services/github';
import {
  isPackageStatus,
  PackageStatus,
} from 'rollingversions/lib/utils/getPackageStatuses';
import orFn from 'rollingversions/lib/ts-utils/orFn';
import arrayEvery from 'rollingversions/lib/ts-utils/arrayEvery';
import sortPackages from 'rollingversions/lib/utils/sortPackages';
import {Repository} from 'rollingversions/lib/types';
import {RepoResponse} from '../../../types';
import readRepositoryState from '../../db-update-jobs/methods/readRepositoryState';
import {db} from '../../services/postgres';
import {GitHubClient} from '../../services/github';
import {Logger} from '../../logger';

export default async function getRepository(
  client: GitHubClient,
  repo: Repository,
  logger: Logger,
): Promise<RepoResponse> {
  const [branch, unsortedPackageStatuses] = await Promise.all([
    getBranch(client, repo),
    readRepositoryState(db, client, repo, logger),
  ] as const);

  const isSuccessPackageStatus = orFn(
    isPackageStatus(PackageStatus.NewVersionToBePublished),
    isPackageStatus(PackageStatus.NoUpdateRequired),
  );

  if (!arrayEvery(unsortedPackageStatuses, isSuccessPackageStatus)) {
    return {
      headSha: branch?.headSha || null,
      packages: unsortedPackageStatuses,
      cycleDetected: null,
    };
  }

  const sortResult = await sortPackages(unsortedPackageStatuses);

  if (sortResult.circular) {
    return {
      headSha: branch?.headSha || null,
      packages: unsortedPackageStatuses,
      cycleDetected: sortResult.packageNames,
    };
  }

  return {
    headSha: branch?.headSha || null,
    packages: sortResult.packages,
    cycleDetected: null,
  };
}
