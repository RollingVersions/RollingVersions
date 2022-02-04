import assertNever from 'assert-never';
import minimatch from 'minimatch';

import {DbGitRepository} from '@rollingversions/db';
import type {PackageManifest} from '@rollingversions/types';
import {
  legacyManifests,
  getPackageManifests,
} from 'rollingversions/lib/PublishTargets';
import {GetManifestsResult} from 'rollingversions/src/PublishTargets/baseTarget';

import type {Logger} from '../../logger';
import {GitHubClient} from '../../services/github';
import {fetchTree} from '../git';
import getRollingVersionsConfig from './getRollingVersionsConfig';
import mergePackageManifests from './mergePackageManifests';

export type GetPackageManifestsResult = {
  oid: string;
  packages: Map<string, PackageManifest>;
  packageErrors: {filename: string; error: string}[];
  hasReleaseTrigger: boolean;
};

const CONFIG_FILENAME = `.github/rolling-versions.toml`;
export default async function listPackages(
  client: GitHubClient,
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
): Promise<GetPackageManifestsResult> {
  const config = await getRollingVersionsConfig(client, repo, commitSha);

  if (!config.ok) {
    const builder = makePackageManifestsResultBuilder(commitSha, false);
    builder.pushError({filename: CONFIG_FILENAME, error: config.reason});
    return builder.getResult();
  }

  if (!config.value) {
    return await listPackagesLegacy(repo, commitSha, logger);
  }

  const builder = makePackageManifestsResultBuilder(
    commitSha,
    !!config.value.release_trigger,
  );
  const patterns: {
    status: 'pattern';
    path: string;
    getPackageManifests: (
      path: string,
      content: string,
    ) => GetManifestsResult[];
  }[] = [];

  for (const result of getPackageManifests(config.value)) {
    switch (result.status) {
      case 'error':
        builder.pushError({filename: CONFIG_FILENAME, error: result.reason});
        break;
      case 'manifest':
        builder.pushManifest(CONFIG_FILENAME, result.manifest);
        break;
      case 'pattern':
        patterns.push(result);
        break;
      default:
        return assertNever(result);
    }
  }

  if (patterns.length) {
    const files = await fetchTree(repo, commitSha, logger);
    await Promise.all(
      files.map(async (file) => {
        await Promise.all(
          patterns.map(async ({path, getPackageManifests}) => {
            if (minimatch(file.path, path)) {
              for (const result of getPackageManifests(
                file.path,
                await file.getContents(),
              )) {
                switch (result.status) {
                  case 'error':
                    builder.pushError({
                      filename: file.path,
                      error: result.reason,
                    });
                    break;
                  case 'manifest':
                    builder.pushManifest(CONFIG_FILENAME, result.manifest);
                    break;
                  default:
                    assertNever(result);
                    break;
                }
              }
            }
          }),
        );
      }),
    );
  }

  return builder.getResult();
}

async function listPackagesLegacy(
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
): Promise<GetPackageManifestsResult> {
  const builder = makePackageManifestsResultBuilder(commitSha, true);
  const files = await fetchTree(repo, commitSha, logger);

  async function pushFile(file: {
    path: string;
    getContents: () => Promise<string>;
  }) {
    const contents = await file.getContents();
    const {manifests, errors} = await legacyManifests.getPackageManifests(
      file.path,
      contents,
    );
    for (const error of errors) {
      builder.pushError({filename: file.path, error});
    }
    for (const newManifest of manifests) {
      builder.pushManifest(file.path, newManifest);
    }
  }

  await Promise.all(
    files.map(async (file) => {
      if (legacyManifests.pathMayContainPackage(file.path)) {
        await pushFile(file);
      }
    }),
  );

  return builder.getResult();
}

function makePackageManifestsResultBuilder(
  commitSha: string,
  hasReleaseTrigger: boolean,
) {
  const packageErrors: {filename: string; error: string}[] = [];
  const packagesWithErrors = new Set<string>();
  const packages = new Map<string, PackageManifest>();
  function pushError(err: {filename: string; error: string}) {
    packageErrors.push(err);
  }
  function packageHasError(packageName: string) {
    return packagesWithErrors.has(packageName);
  }
  function pushManifest(filename: string, newManifest: PackageManifest) {
    if (packageHasError(newManifest.packageName)) {
      return;
    }
    const existingManifest = packages.get(newManifest.packageName);
    if (existingManifest) {
      const mergeResult = mergePackageManifests(existingManifest, newManifest);
      if (mergeResult.ok) {
        packages.set(newManifest.packageName, mergeResult.manifest);
      } else {
        packages.delete(newManifest.packageName);
        pushError({filename, error: mergeResult.reason});
        packagesWithErrors.add(newManifest.packageName);
      }
    } else {
      packages.set(newManifest.packageName, newManifest);
    }
  }
  function getResult(): GetPackageManifestsResult {
    return {oid: commitSha, packages, packageErrors, hasReleaseTrigger};
  }
  return {pushError, pushManifest, getResult};
}
