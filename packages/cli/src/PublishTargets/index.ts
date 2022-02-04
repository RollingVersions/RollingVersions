import {execBuffered} from 'modern-spawn';

import {RollingConfig} from '@rollingversions/config';
import {printTag} from '@rollingversions/tag-format';
import {PackageManifest} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';
import {printString} from '@rollingversions/version-number';

import type {GitHubClient} from '../services/github';
import isTruthy from '../ts-utils/isTruthy';
import {NewVersionToBePublished} from '../types/PackageStatus';
import PrePublishResult from '../types/PrePublishResult';
import {PublishConfig} from '../types/publish';
import {CommandExecutor, GetManifestsResultWithPatterns} from './baseTarget';
import custom from './custom';
import docker from './docker';
import * as github from './github';
import npm from './npm';

const targets = [custom, docker, npm];

export const legacyManifests = {
  pathMayContainPackage(filename: string): boolean {
    return targets.some((p) =>
      p.legacyManifests.pathMayContainPackage(filename),
    );
  },

  async getPackageManifests(
    filename: string,
    content: string,
  ): Promise<{
    manifests: PackageManifest[];
    errors: string[];
  }> {
    const manifests: PackageManifest[] = [];
    const errors: string[] = [];
    await Promise.all(
      targets
        .filter((p) => p.legacyManifests.pathMayContainPackage(filename))
        .map(async (p) => {
          const result = await p.legacyManifests.getPackageManifest(
            filename,
            content,
          );
          if (result.ok && result.manifest) {
            manifests.push(result.manifest);
          } else if (!result.ok) {
            errors.push(result.reason);
          }
        }),
    );
    return {manifests, errors};
  },
};

export function getPackageManifests(
  globalConfig: RollingConfig,
): GetManifestsResultWithPatterns[] {
  return targets
    .map((t) =>
      globalConfig.packages.map((p) => t.getPackageManifests(p, globalConfig)),
    )
    .reduce((a, b) => a.concat(b), [])
    .reduce((a, b) => a.concat(b), []);
}

export async function prepublish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
  allTagNames: Set<string>,
): Promise<PrePublishResult[]> {
  const executeCommand = getCommandExecuter(config, pkg, packageVersions);
  const prePublishScriptResults = await Promise.all(
    pkg.manifest.scripts.pre_release.map(
      async (script): Promise<(PrePublishResult | null)[]> => {
        const result = await executeCommand(script);
        if (result.status) {
          return [{ok: false, reason: result.stderr.toString('utf8')}];
        } else {
          return [{ok: true}];
        }
      },
    ),
  );
  if (prePublishScriptResults.some((r) => r.some((r) => r?.ok === false))) {
    return prePublishScriptResults
      .reduce((a, b) => a.concat(b), [])
      .filter(isTruthy);
  }
  const results = await Promise.all(
    pkg.manifest.targetConfigs.map(
      (targetConfig): Promise<(PrePublishResult | null)[]> =>
        Promise.all(
          targets.map((t) =>
            t.prepublish(config, pkg, targetConfig, packageVersions),
          ),
        ),
    ),
  );
  return [...prePublishScriptResults, ...results]
    .reduce((a, b) => a.concat(b), [
      github.checkGitHubTagAvailable(config, pkg, allTagNames),
    ])
    .filter(isTruthy);
}

export async function publish(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
  client: GitHubClient,
) {
  const executeCommand = getCommandExecuter(config, pkg, packageVersions);
  for (const target of pkg.manifest.targetConfigs) {
    config.logger.onPublishTargetRelease?.({
      pkg,
      target,
      dryRun: config.dryRun,
    });
    for (const targetAPI of targets) {
      await targetAPI.publish(
        config,
        pkg,
        target,
        packageVersions,
        executeCommand,
      );
    }
    config.logger.onPublishedTargetRelease?.({
      pkg,
      target,
      dryRun: config.dryRun,
    });
  }

  await github.createGitHubRelease(config, client, pkg);

  for (const script of pkg.manifest.scripts.post_release) {
    (await executeCommand(script, {debug: true})).getResult();
  }
}

function getCommandExecuter(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
): CommandExecutor {
  const env = getEnv(config, pkg, packageVersions);
  return async ({command, directory}, {debug = false} = {}) => {
    // TODO: Maybe spawn with sh? Maybe replace env vars in command?
    return await execBuffered(command, {
      env,
      cwd: directory,
      debug,
    });
  };
}
function getEnv(
  config: PublishConfig,
  pkg: NewVersionToBePublished,
  packageVersions: Map<string, VersionNumber | null>,
) {
  const env: {[key: string]: string | undefined} = {...process.env};
  if (config.canary) {
    env.CANARY = config.canary;
  }
  if (config.deployBranch) {
    env.DEPLOY_BRANCH = config.deployBranch;
  }
  if (config.dryRun) {
    env.DRY_RUN = 'TRUE';
  }
  env.GITHUB_REPOSITORY = `${config.owner}/${config.name}`;
  env.GITHUB_REPOSITORY_OWNER = config.owner;
  env.GITHUB_REPOSITORY_NAME = config.name;

  if (pkg.currentVersion) env.CURRENT_VERSION = printString(pkg.currentVersion);
  if (pkg.currentTagName) env.CURRENT_TAG = pkg.currentTagName;

  env.NEW_VERSION = printString(pkg.newVersion);
  env.NEW_TAG = printTag(pkg.newVersion, {
    packageName: pkg.packageName,
    oldTagName: pkg.currentTagName,
    tagFormat: pkg.manifest.tag_format,
    versionSchema: pkg.manifest.version_schema,
  });

  for (const [name, version] of packageVersions) {
    if (version !== null) {
      env[dependencyNameToEnvVar(name)] = printString(version);
    }
  }
  return env;
}

function dependencyNameToEnvVar(name: string) {
  return `DEPENDENCY_${name
    .replace(/\@/g, '')
    .replace(/[^a-z0-9]/gi, '_')
    .toUpperCase()}`;
}
