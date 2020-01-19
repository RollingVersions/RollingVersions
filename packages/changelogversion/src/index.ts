import DataLoader from 'dataloader';
import {graphql} from '@octokit/graphql';
// import Octokit from '@octokit/rest';
import chalk from 'chalk';
import {
  listPackages,
  getCommits,
  getChangeLogs,
} from 'changelogversion-utils/lib/LocalRepo';
import {
  getCurrentVerion,
  getNewVersion,
} from 'changelogversion-utils/lib/Versioning';
import {ChangeLogEntry} from 'changelogversion-utils/lib/PullChangeLog';
import {PackageInfo, Platform} from 'changelogversion-utils/lib/Platforms';
import isTruthy from 'changelogversion-utils/lib/utils/isTruthy';
import {changesToMarkdown} from 'changelogversion-utils/lib/Rendering';

export enum Status {
  MissingTag,
  NoUpdateRequired,
  NewVersionToBePublished,
}
export interface MissingTag {
  status: Status.MissingTag;
  packageName: string;
  currentVersion: string;
}
export interface NoUpdateRequired {
  status: Status.NoUpdateRequired;
  packageName: string;
  currentVersion: string | null;
}
export interface NewVersionToBePublished {
  status: Status.NewVersionToBePublished;
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeLogEntries: readonly (ChangeLogEntry & {pr: number})[];
  pkgInfos: readonly PackageInfo[];
}

export type PackageStatus =
  | MissingTag
  | NoUpdateRequired
  | NewVersionToBePublished;

export interface Config {
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
}

export async function getPackagesStatus({
  dirname,
  owner,
  name,
  accessToken,
}: Config) {
  const commitsLoader = new DataLoader(async (since: readonly string[]) => {
    return await Promise.all(
      since.map((t) => getCommits(dirname, t || undefined)),
    );
  });
  const changeLogsLoader = new DataLoader(
    async (commits: readonly string[]) => {
      return await getChangeLogs(
        graphql.defaults({
          headers: {
            authorization: `token ${accessToken}`,
          },
        }),
        owner,
        name,
        commits,
      );
    },
  );

  const packages = (
    await Promise.all(
      Object.entries(await listPackages(dirname)).map(
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
            };
          }
          const commits = await commitsLoader.load(
            currentTag ? currentTag.commitSha : '',
          );
          const changeLogs = await changeLogsLoader.loadMany(commits);
          const handledPRs = new Set<number>();
          const changeLogEntries: (ChangeLogEntry & {pr: number})[] = [];
          for (const cl of changeLogs) {
            if (cl instanceof Error) {
              throw cl;
            }
            for (const pullChangeLog of cl) {
              if (handledPRs.has(pullChangeLog.pr)) continue;
              handledPRs.add(pullChangeLog.pr);
              for (const pkg of pullChangeLog.packages) {
                if (pkg.packageName === packageName) {
                  changeLogEntries.push(
                    ...pkg.changes.map((c) => ({...c, pr: pullChangeLog.pr})),
                  );
                }
              }
            }
          }
          const newVersion = getNewVersion(currentVersion, changeLogEntries);
          if (!newVersion) {
            return {
              status: Status.NoUpdateRequired,
              currentVersion,
              packageName,
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

export function printPackagesStatus(packages: PackageStatus[]) {
  if (packages.some((p) => p.status === Status.MissingTag)) {
    console.error(`Missing tag for:`);
    console.error(``);
    for (const p of packages.filter((p) => p.status === Status.MissingTag)) {
      console.error(`  - ${p.packageName}@${p.currentVersion}`);
    }
    console.error(``);
    process.exit(1);
  }

  if (packages.some((p) => p.status === Status.NoUpdateRequired)) {
    console.warn(chalk.blue(`# Packages without updates`));
    console.warn(``);
    for (const p of packages.filter(
      (p) => p.status === Status.NoUpdateRequired,
    )) {
      console.warn(
        p.currentVersion
          ? `  - ${p.packageName}@${p.currentVersion}`
          : `  - ${p.packageName}`,
      );
    }
    console.warn(``);
  }

  if (packages.some((p) => p.status === Status.NewVersionToBePublished)) {
    console.warn(chalk.blue(`# Packages to publish`));
    console.warn(``);
    for (const p of packages) {
      if (p.status !== Status.NewVersionToBePublished) continue;
      console.warn(
        chalk.yellow(
          `## ${p.packageName} (${p.currentVersion || 'unreleased'} → ${
            p.newVersion
          })`,
        ),
      );
      console.warn(``);
      console.warn(changesToMarkdown(p.changeLogEntries, 3));
      console.warn(``);
    }
    console.warn(``);
  }
}

export async function canPublishGitHub({
  owner,
  name,
  accessToken,
}: Config): Promise<boolean> {
  const result = await graphql.defaults({
    headers: {
      authorization: `token ${accessToken}`,
    },
  })(
    `query permissions($owner:String!, $name:String!) { 
    repository(owner:$owner,name:$name) {
      viewerPermission
    }
  }`,
    {owner, name},
  );
  const permission =
    result && result.repository && result.repository.viewerPermission;
  return (
    permission === 'ADMIN' ||
    permission === 'MAINTAIN' ||
    permission === 'WRITE'
  );
}
export async function publishGitHub(
  _config: Config,
  _packageName: string,
  _newVersion: string,
  _opts: {isMonoRepo: boolean; hasVPrefix: boolean},
) {
  // TODO: create GitHub release
  // const github = new Octokit({
  //   auth: accessToken,
  // });
  // github.repos.createRelease({
  //   /**
  //    * Text describing the contents of the tag.
  //    */
  //   body?: string;
  //   /**
  //    * `true` to create a draft (unpublished) release, `false` to create a published one.
  //    */
  //   draft?: boolean;
  //   /**
  //    * The name of the release.
  //    */
  //   name?: string;
  //   owner: string;
  //   /**
  //    * `true` to identify the release as a prerelease. `false` to identify the release as a full release.
  //    */
  //   prerelease?: boolean;
  //   repo: string;
  //   /**
  //    * The name of the tag.
  //    */
  //   tag_name: string;
  //   /**
  //    * Specifies the commitish value that determines where the Git tag is created from. Can be any branch or commit SHA. Unused if the Git tag already exists. Default: the repository's default branch (usually `master`).
  //    */
  //   target_commitish?: string;
  // });
}
export async function publish(
  config: Config,
  pkg: PackageInfo,
  newVersion: string,
) {
  switch (pkg.platform) {
    case Platform.npm:
      await publishNpm(config, pkg.path, newVersion);
      break;
  }
}
async function publishNpm(_config: Config, _path: string, _newVersion: string) {
  // TODO
}
