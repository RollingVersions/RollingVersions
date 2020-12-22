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
import {NonTransactionContext} from '../../ServerContext';
import {getCommitByID} from '../../models/Commits';

export default async function getRepository(
  ctx: NonTransactionContext,
  repo: Repository,
): Promise<RepoResponse | null> {
  const repoState = await readRepositoryState(ctx, repo);
  if (!repoState) return null;

  const {branch, packageStatuses: unsortedPackageStatuses} = repoState;

  const isSuccessPackageStatus = orFn(
    isPackageStatus(PackageStatus.NewVersionToBePublished),
    isPackageStatus(PackageStatus.NoUpdateRequired),
  );

  const head = await getCommitByID(ctx, branch.target_git_commit_id);

  if (!arrayEvery(unsortedPackageStatuses, isSuccessPackageStatus)) {
    return {
      headSha: head?.commit_sha || null,
      packages: unsortedPackageStatuses,
      cycleDetected: null,
    };
  }

  const sortResult = await sortPackages(unsortedPackageStatuses);

  if (sortResult.circular) {
    return {
      headSha: head?.commit_sha || null,
      packages: unsortedPackageStatuses,
      cycleDetected: sortResult.packageNames,
    };
  }

  return {
    headSha: head?.commit_sha || null,
    packages: sortResult.packages,
    cycleDetected: null,
  };
}
