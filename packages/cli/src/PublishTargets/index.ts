import {
  PackageDependencies,
  PackageManifest,
  PrePublishResult,
  PublishConfig,
  PublishTarget,
} from '../types';

import isTruthy from '../ts-utils/isTruthy';
import {
  PackageStatusDetail,
  NewVersionToBePublished,
} from '../utils/getPackageStatuses';
import {GitHubClient} from '../services/github';
import getNewTagName from '../utils/getNewTagName';

import * as github from './github';
import * as npm from './npm';
import * as custom_script from './custom_script';

const targets = {
  [PublishTarget.npm]: npm,
  [PublishTarget.custom_script]: custom_script,
};

export function pathMayContainPackage(filename: string): boolean {
  return Object.values(targets).some((p) => p.pathMayContainPackage(filename));
}

export async function getPackageManifests(
  filename: string,
  content: string,
): Promise<
  {
    manifest: Omit<PackageManifest, 'versionTag'>;
    dependencies: PackageDependencies;
  }[]
> {
  return (
    await Promise.all(
      Object.values(targets)
        .filter((p) => p.pathMayContainPackage(filename))
        .map(async (p) => {
          return await p.getPackageManifest(filename, content);
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
    pkg.manifests
      .filter((pi) => !pi.notToBePublished)
      .map((pi) =>
        targets[pi.targetConfig.type].prepublish(
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
    packageStatuses: readonly PackageStatusDetail[];
    packageVersions: Map<string, string | null>;
    client: GitHubClient;
  },
) {
  for (const pkgManifest of pkg.manifests) {
    if (!pkgManifest.notToBePublished) {
      config.logger.onPublishTargetRelease?.({
        pkg,
        pkgManifest,
        dryRun: config.dryRun,
      });
      await targets[pkgManifest.targetConfig.type].publish(
        config,
        pkgManifest,
        pkg.newVersion,
        packageVersions,
      );
      config.logger.onPublishedTargetRelease?.({
        pkg,
        pkgManifest,
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
