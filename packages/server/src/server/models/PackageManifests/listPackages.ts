import assertNever from 'assert-never';
import minimatch from 'minimatch';
import * as toml from 'toml';

import {parseRollingConfig} from '@rollingversions/config';
import {DbGitRepository} from '@rollingversions/db';
import type {PackageManifest} from '@rollingversions/types';
import {
  legacyManifests,
  getPackageManifests,
} from 'rollingversions/lib/PublishTargets';
import {GetManifestsResult} from 'rollingversions/src/PublishTargets/baseTarget';

import type {Logger} from '../../logger';
import {getFileContents, GitHubClient} from '../../services/github';
import {fetchTree} from '../git';
import mergePackageManifests from './mergePackageManifests';

type GetPackageManifestsResult = {
  oid: string;
  packages: Map<string, PackageManifest>;
  packageErrors: {filename: string; error: string}[];
};

const CONFIG_FILENAME = `.github/rolling-versions.toml`;
export default async function listPackages(
  client: GitHubClient,
  repo: DbGitRepository,
  commitSha: string,
  logger: Logger,
): Promise<GetPackageManifestsResult> {
  const configFileContents = await getFileContents(client, {
    repoId: repo.graphql_id,
    commitSha,
    filePath: CONFIG_FILENAME,
  });
  if (configFileContents === null) {
    return await listPackagesLegacy(repo, commitSha, logger);
  }

  const builder = makePackageManifestsResultBuilder(commitSha);

  const parsed = parseToml(configFileContents);
  if (!parsed.ok) {
    builder.pushError({filename: CONFIG_FILENAME, error: parsed.reason});
    return builder.getResult();
  }

  const validated = parseRollingConfig(parsed.value);
  if (!validated.success) {
    builder.pushError({filename: CONFIG_FILENAME, error: validated.reason});
    return builder.getResult();
  }

  const patterns: {
    status: 'pattern';
    path: string;
    getPackageManifests: (
      path: string,
      content: string,
    ) => GetManifestsResult[];
  }[] = [];

  for (const result of getPackageManifests(validated.value)) {
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
  const builder = makePackageManifestsResultBuilder(commitSha);
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

function makePackageManifestsResultBuilder(commitSha: string) {
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
    return {oid: commitSha, packages, packageErrors};
  }
  return {pushError, pushManifest, getResult};
}

function parseToml(str: string) {
  try {
    return {ok: true as const, value: toml.parse(str)};
  } catch (ex: any) {
    return {ok: false as const, reason: ex.message};
  }
}
