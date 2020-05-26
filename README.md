# Rolling Versions

Add changelogs to PRs and use them to determine the version of npm packages

## Commercial Use

Rolling Versions is not free for commercial use (but you can use the hosted version for free while we are in beta). If you would like to buy a license to run your own, self-hosted version for commercial use, contact [hi@rollingversions.com](mailto:hi@rollingversions.com) for pricing.

## Personal Open Source Use

Rolling Versions is free for non-commercial, open source use. You can find [documentation on our website](https://rollingversions.com/help/github-actions).

## Terminology

- Publish Target - a destination we can publish to (e.g. GitHub Releases, NPM, Docker, Crates.io)
- Change Entry - a markdown title and body describing something that changed
- Change Type - breaking (major), feat (minor), refactor (minor), fix (patch), perf (patch)
- Change Set - a set of Change Entries categorised by their Change Type
- Package Manifest - the metadata about a package and where it gets published

## Database

To run database migrations, run `node scripts/db-migrate` and it will ask you for the connection string. To spinup a local database for testing you can use `yarn pg-test start` or even `yarn pg-test run -- yarn dev` to start the app with a temporary database.
