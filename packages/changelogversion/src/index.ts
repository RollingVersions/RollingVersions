import DataLoader from 'dataloader';
import {graphql} from '@octokit/graphql';
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
import {PackageInfo} from 'changelogversion-utils/lib/Platforms';
import isTruthy from 'changelogversion-utils/lib/utils/isTruthy';
import {changesToMarkdown} from 'changelogversion-utils/lib/Rendering';

enum Status {
  MissingTag,
  NoUpdateRequired,
  NewVersionToBePublished,
}
interface MissingTag {
  status: Status.MissingTag;
  packageName: string;
  currentVersion: string;
}
interface NoUpdateRequired {
  status: Status.NoUpdateRequired;
  packageName: string;
  currentVersion: string | null;
}
interface NewVersionToBePublished {
  status: Status.NewVersionToBePublished;
  packageName: string;
  currentVersion: string | null;
  newVersion: string;
  changeLogEntries: readonly (ChangeLogEntry & {pr: number})[];
  pkgInfos: readonly PackageInfo[];
}

type PackageStatus = MissingTag | NoUpdateRequired | NewVersionToBePublished;

interface Config {
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
}

async function run({dirname, owner, name, accessToken}: Config) {
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

run({
  // TODO: create actual CLI that parses args and env and passes in appropriate values for these
  dirname: process.cwd(),
  owner: 'ForbesLindesay',
  name: 'changelogversion',
  accessToken: process.argv[2],
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
