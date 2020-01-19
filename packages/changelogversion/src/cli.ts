#!/usr/bin/env node

import {getPackagesStatus, printPackagesStatus, Status} from '.';

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

if (HELP) {
  console.warn(`Usage: changelogversion <options>`);
  console.warn(``);
  console.warn(`options:
 -h --help                    View these options
 -d --dry-run                 Run without actually publishing packages
 -r --repo         owner/slug The repo being published, can be detected
                              automatically on most CI systems.
 -g --github-token token      A GitHub access token with at least "repo"
                              scope. Used to read changelogs and write
                              git tags/releases.`);
  console.warn(``);
  process.exit(1);
}
const slug = REPO_SLUG.split('/');
if (slug.length !== 2) {
  console.error('Expected repo slug to be of the form <owner>/<name>');
  process.exit(1);
}
const [owner, name] = slug;

getPackagesStatus({
  dirname: DIRNAME,
  owner,
  name,
  accessToken: GITHUB_TOKEN,
})
  .then(async (packages) => {
    printPackagesStatus(packages);
    console.warn('publishing packages...');
    for (const pkg of packages) {
      if (pkg.status === Status.NewVersionToBePublished) {
        const newVersion = pkg.newVersion;
        // TODO: check permission to create GitHub release
        for (const pkgInfo of pkg.pkgInfos) {
          console.warn('checking', newVersion, pkgInfo);
          // TODO: check we have permission to publish to relevant platform
        }
        for (const pkgInfo of pkg.pkgInfos) {
          if (DRY_RUN) {
            console.warn(
              `publishing ${pkgInfo.packageName} to ${pkgInfo.platform} @ ${newVersion} (dry run)`,
            );
          } else {
            console.warn(
              `publishing ${pkgInfo.packageName} to ${pkgInfo.platform} @ ${newVersion}`,
            );
            // TODO: publish to relevant platform
          }
        }
        if (DRY_RUN) {
          console.warn(
            `publishing ${pkg.packageName} as GitHub Release @ ${newVersion} (dry run)`,
          );
        } else {
          console.warn(
            `publishing ${pkg.packageName} as GitHub Release @ ${newVersion}`,
          );
          // TODO: create GitHub release
        }
      }
    }
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
