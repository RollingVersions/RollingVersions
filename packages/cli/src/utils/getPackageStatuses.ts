import DataLoader from 'dataloader';
import {
  GitHubClient,
  readComments,
  getPullRequestsForCommit,
} from '../services/github';
import {getCommits} from '../services/git';
import {getCurrentVerion, getNewVersion} from '../utils/Versioning';
import {
  PackageInfo,
  PublishConfig,
  ChangeSet,
  Repository,
  PullRequest,
} from '../types';
import {ChangeTypes} from '../types/PullRequestState';
import {readState} from './CommentState';
import isTruthy from '../ts-utils/isTruthy';
import {COMMENT_GUID} from './Rendering';
import getEmptyChangeSet from './getEmptyChangeSet';

export enum Status {
  MissingTag,
  NoUpdateRequired,
  NewVersionToBePublished,
}

export interface MissingTag {
  status: Status.MissingTag;
  packageName: string;
  currentVersion: string;
  pkgInfos: readonly PackageInfo[];
}

export interface NoUpdateRequired {
  status: Status.NoUpdateRequired;
  packageName: string;
  currentVersion: string | null;
  newVersion: string | null;
  pkgInfos: readonly PackageInfo[];
}

export interface NewVersionToBePublished {
  status: Status.NewVersionToBePublished;
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeSet: ChangeSet<{pr: number}>;
  pkgInfos: readonly PackageInfo[];
}

export type PackageStatus =
  | MissingTag
  | NoUpdateRequired
  | NewVersionToBePublished;

export type SuccessPackageStatus = NoUpdateRequired | NewVersionToBePublished;

export function isPackageStatus<TStatus extends Status>(status: TStatus) {
  return (
    packageStatus: PackageStatus,
  ): packageStatus is Extract<PackageStatus, {status: TStatus}> =>
    packageStatus.status === status;
}

export default async function getPackageStatuses(
  {dirname, owner, name}: PublishConfig,
  client: GitHubClient,
  pkgInfos: Map<string, PackageInfo[]>,
) {
  const getChangeLogsFromCommits = getChangeLogFetcher(
    client,
    {owner, name},
    async (pr) => {
      for await (const comment of readComments(client, pr)) {
        if (comment.body.includes(COMMENT_GUID)) {
          const st = readState(comment.body);
          return st ? {...st, pr: pr.number} : undefined;
        }
      }
      return undefined;
    },
  );
  const commitsLoader = new DataLoader(async (since: readonly string[]) => {
    return await Promise.all(
      since.map((t) => getCommits(dirname, t || undefined)),
    );
  });

  const packages = await Promise.all(
    [...pkgInfos.entries()].map(
      async ([packageName, pkgInfos]): Promise<PackageStatus> => {
        const currentVersion = getCurrentVerion(pkgInfos);
        const currentTag = currentVersion
          ? pkgInfos.find((info) => info.versionTag?.version === currentVersion)
              ?.versionTag
          : null;
        if (currentVersion && !currentTag) {
          return {
            status: Status.MissingTag,
            packageName,
            currentVersion,
            pkgInfos,
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
            status: Status.NoUpdateRequired,
            currentVersion,
            newVersion: currentVersion,
            packageName,
            pkgInfos,
          };
        }

        return {
          status: Status.NewVersionToBePublished,
          currentVersion,
          newVersion,
          packageName,
          changeSet,
          pkgInfos,
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
  return async function getChangeLog(commitShas: readonly string[]) {
    const pullRequests = [
      ...new Set(
        (await pullRequestsFromCommit.loadMany(commitShas))
          .map((v) => {
            if (v instanceof Error) {
              throw v;
            }
            return v;
          })
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
