import DataLoader from 'dataloader';
import {
  GitHubClient,
  readComments,
  getPullRequestsForCommit,
} from '../services/github';
import {getCurrentVerion, getNewVersion} from '../utils/Versioning';
import {
  PackageInfo,
  ChangeSet,
  Repository,
  PullRequest,
  PackageDependencies,
} from '../types';
import {ChangeTypes} from '../types/PullRequestState';
import {readState} from './CommentState';
import isTruthy from '../ts-utils/isTruthy';
import {COMMENT_GUID} from './Rendering';
import getEmptyChangeSet from './getEmptyChangeSet';
import isString from '../ts-utils/isString';
import notFn from '../ts-utils/notFn';
import {ListedPackages} from './listPackages';
import PackageStatus from '../types/PackageStatus';

export {PackageStatus};

export interface MissingTag {
  status: PackageStatus.MissingTag;
  packageName: string;
  currentVersion: string;
  pkgInfos: readonly PackageInfo[];
  dependencies: PackageDependencies;
}

export interface NoUpdateRequired {
  status: PackageStatus.NoUpdateRequired;
  packageName: string;
  currentVersion: string | null;
  newVersion: string | null;
  pkgInfos: readonly PackageInfo[];
  dependencies: PackageDependencies;
}

export interface NewVersionToBePublished {
  status: PackageStatus.NewVersionToBePublished;
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  pkgInfos: readonly PackageInfo[];
  dependencies: PackageDependencies;
}

export type PackageStatusDetail =
  | MissingTag
  | NoUpdateRequired
  | NewVersionToBePublished;

export type SuccessPackageStatus = NoUpdateRequired | NewVersionToBePublished;

export function isPackageStatus<TStatus extends PackageStatus>(
  status: TStatus,
) {
  return (
    packageStatus: PackageStatusDetail,
  ): packageStatus is Extract<PackageStatusDetail, {status: TStatus}> =>
    packageStatus.status === status;
}

export default async function getPackageStatuses(
  client: GitHubClient,
  {owner, name}: Repository,
  pkgInfos: ListedPackages,
  getCommits: (
    sinceCommitSha: string | undefined,
  ) => Promise<
    readonly (string | {associatedPullRequests: {number: number}[]})[]
  >,
) {
  const getChangeLogsFromCommits = getChangeLogFetcher(
    client,
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
    [...pkgInfos.entries()].map(
      async ([packageName, {infos, dependencies}]): Promise<
        PackageStatusDetail
      > => {
        const currentVersion = getCurrentVerion(infos);
        const currentTag = currentVersion
          ? infos.find((info) => info.versionTag?.version === currentVersion)
              ?.versionTag
          : null;
        if (currentVersion && !currentTag) {
          return {
            status: PackageStatus.MissingTag,
            packageName,
            currentVersion,
            pkgInfos: infos,
            dependencies,
          };
        }
        const commits = await commitsLoader.load(
          currentTag ? currentTag.commitSha : '',
        );
        const changeLogs = await getChangeLogsFromCommits(commits);

        const changeSet = getEmptyChangeSet<{pr: number}>();
        for (const pullChangeLog of changeLogs.filter(isTruthy)) {
          const pkg = pullChangeLog.packages.get(packageName);
          if (pkg) {
            for (const key of ChangeTypes) {
              changeSet[key].push(
                ...pkg.changes[key].map((c) => ({
                  ...c,
                  pr: pullChangeLog.pr,
                })),
              );
            }
          }
        }
        const newVersion = getNewVersion(currentVersion, changeSet);
        if (!newVersion) {
          return {
            status: PackageStatus.NoUpdateRequired,
            currentVersion,
            newVersion: currentVersion,
            packageName,
            pkgInfos: infos,
            dependencies,
          };
        }

        return {
          status: PackageStatus.NewVersionToBePublished,
          currentVersion,
          newVersion,
          packageName,
          changeSet,
          pkgInfos: infos,
          dependencies,
        };
      },
    ),
  );

  return packages;
}

export function getChangeLogFetcher<TChangeLog>(
  client: GitHubClient,
  repo: Repository,
  getChangLog: (pr: Omit<PullRequest, 'headSha'>) => Promise<TChangeLog>,
) {
  const pullRequestsFromCommit = new DataLoader<string, number[]>(
    async (commitShas) => {
      return await Promise.all(
        commitShas.map(async (sha) => {
          return getPullRequestsForCommit(client, repo, sha);
        }),
      );
    },
  );
  const commentFromPullRequest = new DataLoader<number, TChangeLog>(
    async (pullNumbers) => {
      return await Promise.all(
        pullNumbers.map(async (n) => await getChangLog({repo, number: n})),
      );
    },
  );
  return async function getChangeLog(
    commitShas: readonly (
      | string
      | {associatedPullRequests: {number: number}[]}
    )[],
  ) {
    const pullRequests = [
      ...new Set(
        [
          ...(
            await pullRequestsFromCommit.loadMany(commitShas.filter(isString))
          ).map((v) => {
            if (v instanceof Error) {
              throw v;
            }
            return v;
          }),
          ...commitShas
            .filter(notFn(isString))
            .map(({associatedPullRequests}) =>
              associatedPullRequests.map((pr) => pr.number),
            ),
        ].reduce((a, b) => {
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
