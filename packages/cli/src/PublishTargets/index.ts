import {
  PackageDependencies,
  PackageInfo,
  PrePublishResult,
  PublishConfig,
  PublishTarget,
} from '../types';

import isTruthy from '../ts-utils/isTruthy';
import {
  SuccessPackageStatus,
  NewVersionToBePublished,
} from '../utils/getPackageStatuses';
import {GitHubClient} from '../services/github';
import getNewTagName from '../utils/getNewTagName';

import * as github from './github';
import * as npm from './npm';

const targets = {
  [PublishTarget.npm]: npm,
};

export function pathMayContainPackage(filename: string): boolean {
  return Object.values(targets).some((p) => p.pathMayContainPackage(filename));
}

export async function getPackageInfo(
  filename: string,
  content: string,
): Promise<
  {info: Omit<PackageInfo, 'versionTag'>; dependencies: PackageDependencies}[]
> {
  return (
    await Promise.all(
      Object.values(targets)
        .filter((p) => p.pathMayContainPackage(filename))
        .map(async (p) => {
          const info = await p.getPackageInfo(filename, content);
          if (!info) return info;
          const dependencies = await p.getDependencies(filename, content);
          return {info, dependencies};
        }),
    )
  ).filter(isTruthy);
}

export async function prepublish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, string | null>,
): Promise<PrePublishResult[]> {
  return Promise.all(
    pkg.pkgInfos
      .filter((pi) => !pi.notToBePublished)
      .map((pi) =>
        targets[pi.publishTarget].prepublish(
          config,
          pi,
          pkg.newVersion,
          packageVersions,
        ),
      ),
  );
}

export async function publish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  {
    packageStatuses,
    packageVersions,
    client,
  }: {
    packageStatuses: readonly SuccessPackageStatus[];
    packageVersions: Map<string, string | null>;
    client: GitHubClient;
  },
) {
  for (const pkgInfo of pkg.pkgInfos) {
    if (!pkgInfo.notToBePublished) {
      config.logger.onPublishTargetRelease?.({
        pkg,
        pkgInfo,
        dryRun: config.dryRun,
      });
      await targets[pkgInfo.publishTarget].publish(
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

  await github.createGitHubRelease(
    config,
    client,
    pkg,
    getNewTagName(packageStatuses, pkg),
  );
}
