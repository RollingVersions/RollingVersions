#!/usr/bin/env node

import chalk from 'chalk';
import printHelp from './commands/help';
import publish, {PublishResultKind} from './commands/publish';
import {changesToMarkdown} from './utils/Rendering';
import {
  PackageStatus,
  NoUpdateRequired,
  NewVersionToBePublished,
} from './utils/getPackageStatuses';

const CI_ENV = require('env-ci')();

const DIRNAME = process.cwd();

const COMMAND = process.argv[2];

if (process.argv.includes('-h') || process.argv.includes('--help')) {
  printHelp();
  process.exit(0);
}

switch (COMMAND) {
  case 'publish': {
    let dryRun = false;
    let supressErrors = false;
    let repoSlug: string | undefined;
    let githubToken: string | undefined;
    let deployBranch: string | undefined;

    for (let i = 3; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case '-d':
        case '--dry-run':
          if (dryRun) {
            console.error('You cannot specify --dry-run multiple times');
            process.exit(1);
          }
          dryRun = true;
          break;
        case '--supress-errors':
          if (supressErrors) {
            console.error('You cannot specify --supress-errors multiple times');
            process.exit(1);
          }
          supressErrors = true;
          break;
        case '-r':
        case '--repo':
          if (repoSlug) {
            console.error('You cannot specify --repo multiple times');
            process.exit(1);
          }
          repoSlug = process.argv[++i];
          break;
        case '-g':
        case '--github-token':
          if (githubToken) {
            console.error('You cannot specify --github-token multiple times');
            process.exit(1);
          }
          githubToken = process.argv[++i];
          break;
        case '-b':
        case '--deploy-branch':
          if (deployBranch) {
            console.error('You cannot specify --deploy-branch multiple times');
            process.exit(1);
          }
          deployBranch = process.argv[++i];
          break;
      }
    }

    if (!repoSlug) repoSlug = CI_ENV.slug || process.env.GITHUB_REPOSITORY; // GITHUB_REPOSITORY for GitHub Actions
    if (!githubToken) {
      githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    }

    if (!githubToken) {
      console.error(
        'You must specify a GitHub token, either in the "GITHUB_TOKEN" env var or by passing "--github-token <some_token>" on the CLI.',
      );
      process.exit(supressErrors ? 0 : 1);
    }

    if (!repoSlug) {
      console.error(
        'You must specify a GitHub repo by passing "--repo <owner>/<name>" on the CLI. This can normally be automatically determined on CI systems.',
      );
      process.exit(supressErrors ? 0 : 1);
    }

    const slug = repoSlug.split('/');
    if (slug.length !== 2) {
      console.error('Expected repo slug to be of the form <owner>/<name>');
      process.exit(supressErrors ? 0 : 1);
    }
    const [owner, name] = slug;

    publish({
      dirname: DIRNAME,
      owner,
      name,
      accessToken: githubToken,
      deployBranch: deployBranch || null,
      dryRun,
      logger: {
        onValidatedPackages({packages}) {
          const hasUpdates = packages.some(
            (p) => p.status === PackageStatus.NewVersionToBePublished,
          );
          const hasPkgsWithoutUpdates = packages.some(
            (p) => p.status === PackageStatus.NoUpdateRequired,
          );

          if (hasPkgsWithoutUpdates) {
            console.warn(
              hasUpdates
                ? chalk.blue(`# Packages without updates`)
                : chalk.blue(`None of the packages require updates:`),
            );
            console.warn(``);
            for (const p of packages.filter(
              (p): p is NoUpdateRequired =>
                p.status === PackageStatus.NoUpdateRequired,
            )) {
              console.warn(
                p.currentVersion
                  ? `  - ${p.packageName}@${p.currentVersion}`
                  : `  - ${p.packageName}`,
              );
            }
            console.warn(``);
          }

          if (hasUpdates) {
            console.warn(chalk.blue(`# Packages to publish`));
            console.warn(``);
            for (const p of packages.filter(
              (p): p is NewVersionToBePublished =>
                p.status === PackageStatus.NewVersionToBePublished,
            )) {
              console.warn(
                chalk.yellow(
                  `## ${p.packageName} (${p.currentVersion || 'unreleased'} → ${
                    p.newVersion
                  })`,
                ),
              );
              console.warn(``);
              console.warn(changesToMarkdown(p.changeSet, 3));
              console.warn(``);
            }
            console.warn(``);
          }
        },
        onPublishGitHubRelease({pkg, dryRun}) {
          console.warn(
            `publishing ${chalk.yellow(pkg.packageName)} as ${chalk.blue(
              'GitHub Release',
            )} @ ${chalk.yellow(pkg.newVersion)}${
              dryRun ? ` ${chalk.red(`(dry run)`)}` : ''
            }`,
          );
        },
        onPublishTargetRelease({pkg, pkgInfo, dryRun}) {
          console.warn(
            `publishing ${chalk.yellow(pkgInfo.packageName)} to ${chalk.blue(
              pkgInfo.publishTarget,
            )} @ ${chalk.yellow(pkg.newVersion)}${
              dryRun ? ` ${chalk.red(`(dry run)`)}` : ''
            }`,
          );
        },
      },
    })
      .then((result) => {
        switch (result.kind) {
          case PublishResultKind.CircularPackageDependencies:
            console.error(`Detected circular dependency:`);
            console.error(``);
            console.error(`  ${result.packageNames.join(' -> ')}`);
            console.error(``);
            console.error(
              `There is no safe order to publish packages in when there is a circular dependency, therefore none of your packages were published.`,
            );
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.MissingTags:
            console.error(`Missing tag for:`);
            console.error(``);
            for (const p of result.packages) {
              console.error(`  - ${p.packageName}@${p.currentVersion}`);
            }
            console.error(``);
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.GitHubAuthCheckFail:
            console.error(`GitHub pre-release steps failed:`);
            console.error(``);
            console.error(`  ${result.reason}`);
            console.error(``);
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.PrepublishFailures:
            for (const {pkg, reasons} of result.failures) {
              console.error(
                `Pre-release steps failed for ${pkg.packageName}@${pkg.newVersion}:`,
              );
              console.error(``);
              if (reasons.length === 1) {
                console.error(`  ${reasons[0]}`);
              } else {
                for (const reason of reasons) {
                  console.error(`  - ${reason}`);
                }
              }
              console.error(``);
            }
            return process.exit(supressErrors ? 0 : 1);
          case PublishResultKind.NoUpdatesRequired:
            return process.exit(0);
          case PublishResultKind.UpdatesPublished:
            console.warn(chalk.green(`Updates published`));
            return process.exit(0);
        }
      })
      .catch((ex: any) => {
        console.error(ex.stack);
        process.exit(1);
      });
    break;
  }
  default: {
    printHelp();
    process.exit(COMMAND === 'help' ? 0 : 1);
    break;
  }
}
