import {GitHubClient, getAllCommits} from '../services/github';
import {ChangeSet, PackageInfo, PullRequest} from '../types';

export default async function getUnreleasedPackages(
  client: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> & {closed: boolean},
  packages: Map<string, {changes: ChangeSet; info: PackageInfo[]}>,
) {
  if (!pullRequest.closed) {
    return new Set(packages.keys());
  }
  const unknownPackages = new Set(packages.keys());
  for (const [packageName, {info}] of packages) {
    if (!info.some((i) => i.versionTag)) {
      unknownPackages.delete(packageName);
    }
  }
  const unreleasedPackages = new Set(packages.keys());
  for await (const commit of getAllCommits(client, pullRequest.repo, {
    deployBranch: null,
  })) {
    for (const [packageName, {info}] of packages) {
      if (unknownPackages.has(packageName)) {
        for (const packageInfo of info) {
          if (
            packageInfo.versionTag &&
            packageInfo.versionTag.commitSha === commit.oid
          ) {
            unknownPackages.delete(packageName);
            unreleasedPackages.delete(packageName);
          }
        }
      }
    }
    if (
      commit.associatedPullRequests.some(
        (pr) => pr?.number === pullRequest.number,
      ) ||
      !unknownPackages.size
    ) {
      return unreleasedPackages;
    }
  }
  return unreleasedPackages;
}
