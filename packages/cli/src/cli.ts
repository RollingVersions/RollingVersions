#!/usr/bin/env node

import chalk from 'chalk';
import {parse, startChain, param} from 'parameter-reducers';
import printHelp from './commands/help';
import publish, {PublishResultKind} from './commands/publish';
import changesToMarkdown from './utils/changesToMarkdown';
import {
  PackageStatus,
  NoUpdateRequired,
  NewVersionToBePublished,
} from './utils/getPackageStatuses';

const CI_ENV = require('env-ci')();

const DIRNAME = process.cwd();

const COMMAND = process.argv[2];
const PARAMS = process.argv.slice(3);

const helpParams = startChain().addParam(param.flag(['-h', '--help'], 'help'));

switch (COMMAND) {
  case 'publish': {
    const publishParams = helpParams
      .addParam(param.flag(['-d', '--dry-run'], 'dryRun'))
      .addParam(param.flag(['--supress-errors'], 'supressErrors'))
      .addParam(param.string(['-r', '--repo'], 'repoSlug'))
      .addParam(param.string(['-g', '--github-token'], 'githubToken'))
      .addParam(param.string(['-b', '--deploy-branch'], 'deployBranch'))
      .addParam(
        param.parsedString(['--canary'], 'canary', (value) => {
          if (!value) {
            return {
              valid: false,
              reason: `When using the "--canary" flag, you *must* provide a build number as the parameter.`,
            };
          }
          return {valid: true, value};
        }),
      );
    const parserResult = parse(publishParams, PARAMS);
    if (!parserResult.valid) {
      console.error(parserResult.reason);
      process.exit(1);
    }
    if (parserResult.parsed.help) {
      printHelp();
      process.exit(0);
    }
    if (parserResult.rest.length) {
      console.error(`Unrecognized parameter "${parserResult.rest[0]}"`);
      process.exit(1);
    }
    const {
      dryRun = false,
      supressErrors = false,
      // env.CI does not support GitHub actions, which uses GITHUB_REPOSITORY
      repoSlug = CI_ENV.slug || process.env.GITHUB_REPOSITORY,
      githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      deployBranch,
      canary,
    } = parserResult.parsed;

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
      canary: canary || null,
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
        onPublishGitHubRelease({pkg, dryRun, canary}) {
          if (canary !== null) {
            console.warn(
              `not publishing ${chalk.yellow(pkg.packageName)} as ${chalk.blue(
                'GitHub Release',
              )} in ${chalk.red(`canary mode`)}`,
            );
          } else {
            console.warn(
              `publishing ${chalk.yellow(pkg.packageName)} as ${chalk.blue(
                'GitHub Release',
              )} @ ${chalk.yellow(pkg.newVersion)}${
                dryRun ? ` ${chalk.red(`(dry run)`)}` : ''
              }`,
            );
          }
        },
        onPublishTargetRelease({pkg, pkgManifest, dryRun}) {
          console.warn(
            `publishing ${chalk.yellow(
              pkgManifest.packageName,
            )} to ${chalk.blue(pkgManifest.targetConfig.type)} @ ${chalk.yellow(
              pkg.newVersion,
            )}${dryRun ? ` ${chalk.red(`(dry run)`)}` : ''}`,
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
