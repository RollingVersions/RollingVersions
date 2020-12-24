import {GitHubClient, getAllCommits} from '../services/github';
import {ChangeSet, PackageManifestWithVersion, PullRequest} from '../types';

export default async function getUnreleasedPackages(
  client: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> & {closed: boolean},
  packages: Map<
    string,
    {
      changes: ChangeSet;
      manifests: PackageManifestWithVersion<{commitSha: string}>[];
    }
  >,
) {
  if (!pullRequest.closed) {
    return new Set(packages.keys());
  }
  const unknownPackages = new Set(packages.keys());
  for (const [packageName, {manifests}] of packages) {
    if (!manifests.some((i) => i.versionTag)) {
      unknownPackages.delete(packageName);
    }
  }
  const unreleasedPackages = new Set(packages.keys());
  for await (const commit of getAllCommits(client, pullRequest.repo, {
    deployBranch: null,
  })) {
    for (const [packageName, {manifests}] of packages) {
      if (unknownPackages.has(packageName)) {
        for (const packageManifest of manifests) {
          if (
            packageManifest.versionTag &&
            packageManifest.versionTag.commitSha === commit.oid
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
