import {PackageManifest, PrePublishResult, PublishConfig} from '../types';

import isTruthy from '../ts-utils/isTruthy';
import {GitHubClient} from '../services/github';

import * as github from './github';
import npm from './npm';
import custom_script from './custom_script';
import {NewVersionToBePublished} from '../utils/getPackageStatuses';

const targets = [npm, custom_script];

export function pathMayContainPackage(filename: string): boolean {
  return targets.some((p) => p.pathMayContainPackage(filename));
}

export async function getPackageManifests(
  filename: string,
  content: string,
): Promise<PackageManifest[]> {
  return (
    await Promise.all(
      targets
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
  allTagNames: Set<string>,
): Promise<PrePublishResult[]> {
  const results = await Promise.all(
    pkg.manifest.targetConfigs.map((targetConfig) =>
      Promise.all(
        targets.map((t) =>
          t.prepublish(config, pkg, targetConfig, packageVersions),
        ),
      ),
    ),
  );
  return results
    .reduce((a, b) => a.concat(b), [
      github.checkGitHubTagAvailable(config, pkg, allTagNames),
    ])
    .filter(isTruthy);
}

export async function publish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, string | null>,
  client: GitHubClient,
) {
  for (const target of pkg.manifest.targetConfigs) {
    config.logger.onPublishTargetRelease?.({
      pkg,
      target,
      dryRun: config.dryRun,
    });
    for (const targetAPI of targets) {
      await targetAPI.publish(config, pkg, target, packageVersions);
    }
    config.logger.onPublishedTargetRelease?.({
      pkg,
      target,
      dryRun: config.dryRun,
    });
  }

  await github.createGitHubRelease(config, client, pkg);
}
