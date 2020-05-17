import listPackages from 'rollingversions/lib/utils/listPackages';
import {
  getAllTags,
  getAllFiles,
  getAllCommits,
  getBranch,
  GitHubClient,
} from 'rollingversions/lib/services/github';
import getPackageStatuses, {
  isPackageStatus,
  PackageStatus,
} from 'rollingversions/lib/utils/getPackageStatuses';
import splitAsyncGenerator from 'rollingversions/lib/ts-utils/splitAsyncGenerator';
import orFn from 'rollingversions/lib/ts-utils/orFn';
import arrayEvery from 'rollingversions/lib/ts-utils/arrayEvery';
import sortPackages from 'rollingversions/lib/utils/sortPackages';
import {Repository} from 'rollingversions/lib/types';
import {RepoResponse} from '../../../types';
import addPackageVersions from 'rollingversions/lib/utils/addPackageVersions';

export default async function getRepository(
  client: GitHubClient,
  repo: Repository,
): Promise<RepoResponse> {
  const branch = await getBranch(client, repo);
  const [packageManifestsWithoutVersions, allTags] = await Promise.all([
    listPackages(getAllFiles(client, repo)),
    getAllTags(client, repo),
  ]);
  const packageManifests = await addPackageVersions(
    packageManifestsWithoutVersions,
    allTags,
  );

  const getAllCommitsCached = splitAsyncGenerator(
    getAllCommits(client, repo, {deployBranch: null}),
  );

  const unsortedPackageStatuses = await getPackageStatuses(
    client,
    repo,
    packageManifests,
    async (sinceCommitSha) => {
      const results: {associatedPullRequests: {number: number}[]}[] = [];
      for await (const commit of getAllCommitsCached()) {
        if (commit.oid === sinceCommitSha) {
          return results;
        }
        results.push(commit);
      }
      return results;
    },
  );

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
