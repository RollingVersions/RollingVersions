import DataLoader from 'dataloader';
import {
  GitHubClient,
  getChangeLogFetcher,
} from '@rollingversions/utils/lib/GitHub';
import {getCommits} from '@rollingversions/utils/lib/LocalRepo';
import {
  getCurrentVerion,
  getNewVersion,
} from '@rollingversions/utils/lib/Versioning';
import {ChangeLogEntry} from '@rollingversions/utils/lib/PullChangeLog';
import {PackageInfos} from '@rollingversions/utils/lib/Platforms';
import isTruthy from '@rollingversions/utils/lib/utils/isTruthy';
import {Config, PackageStatus, Status} from '../types';

export async function getPackageStatuses(
  {dirname, owner, name}: Config,
  client: GitHubClient,
  pkgInfos: PackageInfos,
) {
  const getChangeLogsFromCommits = getChangeLogFetcher(client, {owner, name});
  const commitsLoader = new DataLoader(async (since: readonly string[]) => {
    return await Promise.all(
      since.map((t) => getCommits(dirname, t || undefined)),
    );
  });

  const packages = (
    await Promise.all(
      Object.entries(pkgInfos).map(
        async ([packageName, pkgInfos]): Promise<PackageStatus | null> => {
          if (!pkgInfos) return null;
          const currentVersion = getCurrentVerion(pkgInfos);
          const currentTag = currentVersion
            ? pkgInfos.find(
                (info) => info.versionTag?.version === currentVersion,
              )?.versionTag
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
          const changeLogEntries: (ChangeLogEntry & {pr: number})[] = [];
          for (const pullChangeLog of changeLogs) {
            for (const pkg of pullChangeLog.packages) {
              if (pkg.packageName === packageName) {
                changeLogEntries.push(
                  ...pkg.changes.map((c) => ({...c, pr: pullChangeLog.pr})),
                );
              }
            }
          }
          const newVersion = getNewVersion(currentVersion, changeLogEntries);
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
            changeLogEntries,
            pkgInfos,
          };
        },
      ),
    )
  ).filter(isTruthy);

  return packages;
}
