import {Platform} from '@rollingversions/utils/lib/Platforms';
import {
  Config,
  SuccessPackageStatus,
  PackageDependencies,
  NewVersionToBePublished,
  PrePublishResult,
} from '../types';

import * as npm from './npm';

const platforms = {
  [Platform.npm]: npm,
};

export function getDependencies(
  config: Pick<Config, 'dirname'>,
  pkg: SuccessPackageStatus,
) {
  const deps = pkg.pkgInfos.map((pi) =>
    platforms[pi.platform].getDependencies(config, pi),
  );

  if (deps.length === 1) return deps[0];

  const result: PackageDependencies = {
    required: [],
    optional: [],
    development: [],
  };

  deps.forEach((dependencies) => {
    for (const key of ['required', 'optional', 'development'] as const) {
      result[key].push(
        ...dependencies[key].filter((d) => !result[key].includes(d)),
      );
    }
  });

  return result;
}

export async function prepublish(
  config: Config,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, string | null>,
): Promise<PrePublishResult[]> {
  return Promise.all(
    pkg.pkgInfos.map((pi) =>
      platforms[pi.platform].prepublish(
        config,
        pi,
        pkg.newVersion,
        packageVersions,
      ),
    ),
  );
}

export async function publish(
  config: Config,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, string | null>,
) {
  for (const pkgInfo of pkg.pkgInfos) {
    config.logger.onPublishTargetRelease?.({
      pkg,
      pkgInfo,
      dryRun: config.dryRun,
    });
    await platforms[pkgInfo.platform].publish(
      config,
      pkgInfo,
      pkg.newVersion,
      packageVersions,
    );
    config.logger.onPublishedTargetRelease?.({
      pkg,
      pkgInfo,
      dryRun: config.dryRun,
    });
  }
}
