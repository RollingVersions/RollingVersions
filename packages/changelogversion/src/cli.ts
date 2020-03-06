#!/usr/bin/env node

import {
  getPackagesStatus,
  printPackagesStatus,
  Status,
  publishGitHub,
  prepublishGitHub,
  Config,
  getGitTag,
  prepublish,
  publish,
  isSuccessPackageStatus,
} from '.';
import chalk = require('chalk');

const CI_ENV = require('env-ci')();

function boolArg(key: string) {
  return process.argv.includes(key);
}
function stringArg(key: string) {
  const i = process.argv.indexOf(key);
  return i === -1 ? undefined : process.argv[i + 1];
}
function error(msg: string): never {
  console.error(msg);
  return process.exit(1);
}

const DIRNAME = process.cwd();
const DRY_RUN = boolArg('-d') || boolArg('--dry-run');
const HELP = boolArg('-h') || boolArg('--help');

const REPO_SLUG: string =
  CI_ENV.slug ||
  stringArg('-r') ||
  stringArg('--repo') ||
  error(
    'You must specify a GitHub repo by passing "--repo <owner>/<name>" on the CLI. This can normally be automatically determined on CI systems.',
  );

const GITHUB_TOKEN: string =
  stringArg('-g') ||
  stringArg('--github-token') ||
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  error(
    'You must specify a GitHub token, either in the "GITHUB_TOKEN" env var or by passing "--github-token <some_token>" on the CLI.',
  );

const DEPLOY_BRANCH: string | null =
  stringArg('-b') || stringArg('--deploy-branch') || null;

const SUPRESS_ERRORS = boolArg('--supress-errors');
const ERROR_EXIT = SUPRESS_ERRORS ? 0 : 1;

if (HELP) {
  console.warn(`Usage: changelogversion <options>`);
  console.warn(``);
  console.warn(`options:

 -h --help                     View these options
 -d --dry-run                  Run without actually publishing packages
    --supress-errors           Always exit with "0" status code even
 -r --repo          owner/slug The repo being published, can be detected
                               automatically on most CI systems.
 -g --github-token  token      A GitHub access token with at least "repo"
                               scope. Used to read changelogs and write
                               git tags/releases.
 -d --deploy-branch branch     The branch to deploy from. This will default
                               to your default branch on GitHub.`);
  console.warn(``);
  process.exit(ERROR_EXIT);
}
const slug = REPO_SLUG.split('/');
if (slug.length !== 2) {
  console.error('Expected repo slug to be of the form <owner>/<name>');
  process.exit(ERROR_EXIT);
}
const [owner, name] = slug;

const config: Config = {
  dirname: DIRNAME,
  owner,
  name,
  accessToken: GITHUB_TOKEN,
  deployBranch: DEPLOY_BRANCH,
};
getPackagesStatus(config)
  .then(async (packagesThatMayHaveErrors) => {
    printPackagesStatus(packagesThatMayHaveErrors);
    const packages = packagesThatMayHaveErrors.filter(isSuccessPackageStatus);
    if (packagesThatMayHaveErrors.length !== packages.length) {
      process.exit(ERROR_EXIT);
    }
    const packageVersions = new Map(
      packages.map((p) => [p.packageName, p.newVersion]),
    );
    if (packages.some((pkg) => pkg.status === Status.NewVersionToBePublished)) {
      // prepublish checks
      const gitHubPrepublishInfo = await prepublishGitHub(config);
      if (!gitHubPrepublishInfo.ok) {
        console.error(gitHubPrepublishInfo.reason);
        process.exit(ERROR_EXIT);
      }
      for (const pkg of packages) {
        if (pkg.status === Status.NewVersionToBePublished) {
          const tagName = getGitTag(packages, pkg);
          if (gitHubPrepublishInfo.tags.includes(tagName)) {
            console.error(`A github release already exists for ${tagName}`);
            process.exit(ERROR_EXIT);
          }
          for (const pkgInfo of pkg.pkgInfos) {
            if (pkgInfo.notToBePublished) continue;
            const prepublishResult = await prepublish(
              config,
              pkgInfo,
              pkg.newVersion,
              packageVersions,
            );
            if (!prepublishResult.ok) {
              console.error(prepublishResult.reason);
              process.exit(ERROR_EXIT);
            }
          }
        }
      }
    }
    for (const pkg of packages) {
      if (pkg.status === Status.NewVersionToBePublished) {
        const newVersion = pkg.newVersion;

        for (const pkgInfo of pkg.pkgInfos) {
          if (pkgInfo.notToBePublished) continue;
          if (DRY_RUN) {
            console.warn(
              `publishing ${chalk.yellow(pkgInfo.packageName)} to ${chalk.blue(
                pkgInfo.platform,
              )} @ ${chalk.yellow(newVersion)} ${chalk.red(`(dry run)`)}`,
            );
          } else {
            console.warn(
              `publishing ${chalk.yellow(pkgInfo.packageName)} to ${chalk.blue(
                pkgInfo.platform,
              )} @ ${chalk.yellow(newVersion)}`,
            );
            await publish(config, pkgInfo, newVersion, packageVersions);
          }
        }

        if (DRY_RUN) {
          console.warn(
            `publishing ${chalk.yellow(pkg.packageName)} as ${chalk.blue(
              'GitHub Release',
            )} @ ${chalk.yellow(newVersion)} ${chalk.red(`(dry run)`)}`,
          );
        } else {
          console.warn(
            `publishing ${chalk.yellow(pkg.packageName)} as ${chalk.blue(
              'GitHub Release',
            )} @ ${chalk.yellow(newVersion)}`,
          );
          await publishGitHub(config, pkg, getGitTag(packages, pkg));
        }
      }
    }
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(ERROR_EXIT);
  });
