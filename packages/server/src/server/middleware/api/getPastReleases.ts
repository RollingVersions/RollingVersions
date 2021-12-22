import db from '@rollingversions/db';
import {
  lt,
  parseString,
  printString,
  sortDescending,
} from '@rollingversions/version-number';

import type {Logger} from '../../logger';
import {
  getBranchHeadCommit,
  getAllTags,
  getCommitBySha,
} from '../../models/git';
import {
  getPackageManifests,
  getPackageVersions,
} from '../../models/PackageManifests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import {getRelease, GitHubClient} from '../../services/github';
import {Permission} from '../utils/checkPermissions';

const MAX_PAGE_SIZE = 10;
export default async function getPastReleases(
  client: GitHubClient,
  repository: {
    owner: string;
    name: string;
  },
  {
    commit,
    branch,
    packageName,
    before,
    permission,
  }: {
    commit?: string;
    branch?: string;
    packageName?: string;
    before?: string;
    permission: Permission;
  },
  logger: Logger,
): Promise<{
  nextPageToken: string | null;
  releases: {
    packageName: string;
    version: string;
    body: string;
    editLink?: string;
  }[];
} | null> {
  const repo = await getRepositoryFromRestParams(db, client, repository);
  if (!repo) return null;

  const headCommit = await (commit
    ? getCommitBySha(db, client, repo, commit, logger)
    : branch
    ? getBranchHeadCommit(db, client, repo, branch, logger)
    : getBranchHeadCommit(db, client, repo, repo.default_branch_name, logger));
  if (!headCommit) {
    return null;
  }

  const [allTags, getPackageManifestsResult] = await Promise.all([
    getAllTags(db, client, repo, logger),
    getPackageManifests(
      db,
      client,
      repo,
      {type: 'commit', commit: headCommit},
      logger,
    ),
  ]);

  if (!getPackageManifestsResult) return null;

  const {packages: packagesByName} = getPackageManifestsResult;

  const packageManifests = packageName
    ? [packagesByName.get(packageName)].filter(
        <T>(v: T): v is Exclude<T, undefined> => v !== undefined,
      )
    : [...packagesByName.values()];
  let nextPageToken: string | null = null;
  const packageReleases = await Promise.all(
    packageManifests.map(async (manifest, _, manifests) => {
      let allVersions = sortDescending(
        getPackageVersions({
          allowTagsWithoutPackageName: manifests.length <= 1,
          allTags,
          manifest,
        }),
        (v) => v.version,
      );
      if (manifests.length > 1) {
        // If there are multiple packages, just return the latest version for each package
        allVersions = [allVersions[0]];
      }
      const beforeVersion = before && parseString(before);
      if (beforeVersion) {
        allVersions = allVersions.filter((v) => lt(v.version, beforeVersion));
      }
      if (allVersions.length > MAX_PAGE_SIZE) {
        nextPageToken = printString(allVersions[MAX_PAGE_SIZE - 1].version);
        allVersions = allVersions.slice(0, MAX_PAGE_SIZE);
      }

      const releases = await Promise.all(
        allVersions.map(async (v) => {
          const release = await getRelease(client, {
            ...repo,
            tagName: v.name,
          });
          return {
            packageName: manifest.packageName,
            version: printString(v.version),
            body: release?.description ?? `_No Change Log Provided_`,
            editLink:
              permission === 'edit'
                ? `https://github.com/${encodeURIComponent(
                    repo.owner,
                  )}/${encodeURIComponent(
                    repo.name,
                  )}/releases/edit/${encodeURIComponent(v.name)}`
                : undefined,
          };
        }),
      );
      return releases;
    }),
  );

  return {nextPageToken, releases: packageReleases.flat(1)};
}
