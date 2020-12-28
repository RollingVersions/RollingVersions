import DataLoader from 'dataloader';
import {GitHubClient, readComments} from '../services/github';
import {getCurrentVerion, getNewVersion} from '../utils/Versioning';
import {
  Repository,
  PullRequest,
  PackageDependencies,
  PackageManifestWithVersion,
} from '../types';
import {readState} from './CommentState';
import isTruthy from '../ts-utils/isTruthy';
import PackageStatus from '../types/PackageStatus';
import ChangeSet, {
  addContextToChangeSet,
  mergeChangeSets,
} from '@rollingversions/change-set';

// N.B. This comment GUID must be kept in sync with the server code for now
const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;

export {PackageStatus};

export interface NoUpdateRequired {
  status: PackageStatus.NoUpdateRequired;
  packageName: string;
  currentVersion: string | null;
  newVersion: string | null;
  manifests: readonly PackageManifestWithVersion[];
  dependencies: PackageDependencies;
}

export interface NewVersionToBePublished {
  status: PackageStatus.NewVersionToBePublished;
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  manifests: readonly PackageManifestWithVersion[];
  dependencies: PackageDependencies;
}

export type PackageStatusDetail = NoUpdateRequired | NewVersionToBePublished;

export default async function getPackageStatuses(
  client: GitHubClient,
  {owner, name}: Repository,
  pkgManifests: Map<
    string,
    {
      manifests: PackageManifestWithVersion[];
      dependencies: PackageDependencies;
    }
  >,
  getCommits: (
    sinceCommitSha: string | undefined,
  ) => Promise<readonly {associatedPullRequests: {number: number}[]}[]>,
) {
  const getChangeLogsFromCommits = getChangeLogFetcher(
    {owner, name},
    async (pr) => {
      for await (const comment of readComments(client, pr)) {
        if (comment.body.includes(COMMENT_GUID)) {
          try {
            const st = readState(comment.body);
            return st ? {...st, pr: pr.number} : undefined;
          } catch (ex) {
            console.warn(`Unable to read state for pull request: ${pr.number}`);
            return undefined;
          }
        }
      }
      return undefined;
    },
  );
  const commitsLoader = new DataLoader(
    async (sinceCommitSha: readonly string[]) => {
      return await Promise.all(
        sinceCommitSha.map((sha) => getCommits(sha || undefined)),
      );
    },
  );

  const packages = await Promise.all(
    [...pkgManifests.entries()].map(
      async ([
        packageName,
        {manifests, dependencies},
      ]): Promise<PackageStatusDetail> => {
        const currentVersion = getCurrentVerion(manifests);
        const currentTag = currentVersion
          ? manifests.find(
              (manifest) => manifest.versionTag?.version === currentVersion,
            )?.versionTag
          : null;
        const commits = await commitsLoader.load(
          currentTag ? currentTag.commitSha : '',
        );
        const changeLogs = await getChangeLogsFromCommits(commits);

        const changeSet = mergeChangeSets(
          ...changeLogs
            .filter(isTruthy)
            .map((pullChangeLog) => {
              const changeSet = pullChangeLog.packages.get(packageName);
              return changeSet
                ? addContextToChangeSet(changeSet, {pr: pullChangeLog.pr})
                : null;
            })
            .filter(isTruthy),
        );
        const newVersion = getNewVersion(currentVersion, changeSet);
        if (!newVersion) {
          return {
            status: PackageStatus.NoUpdateRequired,
            currentVersion,
            newVersion: currentVersion,
            packageName,
            manifests: manifests,
            dependencies,
          };
        }

        return {
          status: PackageStatus.NewVersionToBePublished,
          currentVersion,
          newVersion,
          packageName,
          changeSet,
          manifests: manifests,
          dependencies,
        };
      },
    ),
  );

  return packages;
}

export function getChangeLogFetcher<TChangeLog>(
  repo: Repository,
  getChangLog: (pr: Omit<PullRequest, 'headSha'>) => Promise<TChangeLog>,
) {
  const commentFromPullRequest = new DataLoader<number, TChangeLog>(
    async (pullNumbers) => {
      return await Promise.all(
        pullNumbers.map(async (n) => await getChangLog({repo, number: n})),
      );
    },
  );
  return async function getChangeLog(
    commitShas: readonly {associatedPullRequests: {number: number}[]}[],
  ) {
    const pullRequests = [
      ...new Set(
        commitShas
          .map(({associatedPullRequests}) =>
            associatedPullRequests.map((pr) => pr.number),
          )
          .reduce((a, b) => {
            a.push(...b);
            return a;
          }, []),
      ),
    ];
    return (await commentFromPullRequest.loadMany(pullRequests)).map((s) => {
      if (s instanceof Error) {
        throw s;
      }
      return s;
    });
  };
}
