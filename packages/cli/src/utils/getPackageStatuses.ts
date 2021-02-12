import DataLoader from 'dataloader';
import {GitHubClient, readComments} from '../services/github';
import {Repository, PullRequest, PackageManifestWithVersion} from '../types';
import {readState} from './CommentState';
import isTruthy from '../ts-utils/isTruthy';
import PackageStatus from '../types/PackageStatus';
import ChangeSet, {
  addContextToChangeSet,
  mergeChangeSets,
} from '@rollingversions/change-set';
import VersionNumber, {getNextVersion} from '@rollingversions/version-number';

// N.B. This comment GUID must be kept in sync with the server code for now
const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;

export {PackageStatus};

export interface NoUpdateRequired {
  status: PackageStatus.NoUpdateRequired;
  packageName: string;
  currentVersion: VersionNumber | null;
  newVersion: VersionNumber | null;
  manifest: PackageManifestWithVersion;
}

export interface NewVersionToBePublished {
  status: PackageStatus.NewVersionToBePublished;
  packageName: string;
  currentTagName: string | null;
  currentVersion: VersionNumber | null;
  newVersion: VersionNumber;
  changeSet: ChangeSet<{pr: number}>;
  manifest: PackageManifestWithVersion;
}

export type PackageStatusDetail = NoUpdateRequired | NewVersionToBePublished;

export default async function getPackageStatuses(
  client: GitHubClient,
  {owner, name}: Repository,
  pkgManifests: Map<string, PackageManifestWithVersion>,
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
      async ([packageName, manifest]): Promise<PackageStatusDetail> => {
        const currentVersion = manifest.versionTag?.version ?? null;
        const currentTag = manifest.versionTag ?? null;
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
        const newVersion = getNextVersion(currentVersion, changeSet);
        if (!newVersion) {
          return {
            status: PackageStatus.NoUpdateRequired,
            currentVersion,
            newVersion: currentVersion,
            packageName,
            manifest,
          };
        }

        return {
          status: PackageStatus.NewVersionToBePublished,
          currentVersion,
          currentTagName: currentTag?.name ?? null,
          newVersion,
          packageName,
          changeSet,
          manifest,
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
