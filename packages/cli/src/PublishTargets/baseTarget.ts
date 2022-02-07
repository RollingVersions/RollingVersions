import {
  completeConfig,
  PackageConfig,
  RollingConfig,
} from '@rollingversions/config';
import {
  PackageManifest,
  PublishTarget,
  PublishTargetConfig,
} from '@rollingversions/types';
import type VersionNumber from '@rollingversions/version-number';

import {NewVersionToBePublished} from '../types/PackageStatus';
import type PrePublishResult from '../types/PrePublishResult';
import type {PublishConfig} from '../types/publish';

export function cmd(
  command: string | undefined,
): {command: string} | undefined {
  return command ? {command} : undefined;
}
export function cmdList(command: string | undefined): {command: string}[] {
  return command ? [{command}] : [];
}

export type CommandExecutor = (
  script: {
    readonly command: string;
    readonly directory?: string;
  },
  options?: {debug?: boolean},
) => Promise<{
  readonly stderr: Buffer;
  readonly status: number | null;
  getResult(): Buffer;
}>;

export type GetManifestsResult =
  | {status: 'manifest'; manifest: PackageManifest}
  | {status: 'error'; reason: string};
export type GetManifestsResultWithPatterns =
  | {status: 'manifest'; manifest: PackageManifest}
  | {status: 'error'; reason: string}
  | {
      status: 'pattern';
      path: string;
      getPackageManifests: (
        path: string,
        content: string,
      ) => GetManifestsResult[];
    };

export interface BaseTargetConfig<TPublishTarget extends PublishTarget> {
  type: TPublishTarget;
  legacyManifests: {
    pathMayContainPackage(filename: string): boolean;
    getPackageManifest(
      path: string,
      content: string,
    ): Promise<
      {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
    >;
  };
  getPackageManifests(
    config: Extract<PackageConfig, {readonly type: TPublishTarget}>,
    globalConfig: Pick<
      PackageManifest,
      | 'scripts'
      | 'tag_format'
      | 'change_types'
      | 'versioning_mode'
      | 'version_schema'
      | 'base_version'
      | 'customized'
    >,
  ): GetManifestsResultWithPatterns[];
  prepublish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: Extract<PublishTargetConfig, {readonly type: TPublishTarget}>,
    packageVersions: Map<string, VersionNumber | null>,
  ): Promise<PrePublishResult>;
  publish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: Extract<PublishTargetConfig, {readonly type: TPublishTarget}>,
    packageVersions: Map<string, VersionNumber | null>,
    executeCommand: CommandExecutor,
  ): Promise<void>;
}

export interface BaseTarget {
  legacyManifests: {
    pathMayContainPackage(filename: string): boolean;
    getPackageManifest(
      path: string,
      content: string,
    ): Promise<
      {ok: true; manifest: PackageManifest | null} | {ok: false; reason: string}
    >;
  };
  getPackageManifests(
    config: PackageConfig,
    globalConfig: RollingConfig,
  ): GetManifestsResultWithPatterns[];
  prepublish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: PublishTargetConfig,
    packageVersions: Map<string, VersionNumber | null>,
  ): Promise<PrePublishResult | null>;
  publish(
    config: PublishConfig,
    pkg: NewVersionToBePublished,
    targetConfig: PublishTargetConfig,
    packageVersions: Map<string, VersionNumber | null>,
    executeCommand: CommandExecutor,
  ): Promise<null | true>;
}

export default function createPublishTargetAPI<
  TPublishTarget extends PublishTarget
>(target: BaseTargetConfig<TPublishTarget>): BaseTarget {
  function isPackageConfig(
    config: PackageConfig,
  ): config is Extract<PackageConfig, {readonly type: TPublishTarget}> {
    return config.type === target.type;
  }
  function isTargetConfig(
    config: PublishTargetConfig,
  ): config is Extract<PublishTargetConfig, {readonly type: TPublishTarget}> {
    return config.type === target.type;
  }
  return {
    getPackageManifests: (config, globalConfig) => {
      if (!isPackageConfig(config)) {
        return [];
      }
      const completedConfig = completeConfig(config, globalConfig);
      if (completedConfig.success) {
        const {options, customized} = completedConfig.value;
        return target.getPackageManifests(config, {
          ...options,
          customized,
          scripts: {
            pre_release: cmdList(config.scripts?.pre_release),
            post_release: cmdList(config.scripts?.post_release),
          },
        });
      }
      return [];
    },

    legacyManifests: {
      pathMayContainPackage: (filename) =>
        target.legacyManifests.pathMayContainPackage(filename),
      getPackageManifest: (filename, content) =>
        target.legacyManifests.getPackageManifest(filename, content),
    },

    prepublish: (config, pkg, targetConfig, packageVersions) => {
      return isTargetConfig(targetConfig)
        ? target.prepublish(config, pkg, targetConfig, packageVersions)
        : Promise.resolve(null);
    },
    publish: async (
      config,
      pkg,
      targetConfig,
      packageVersions,
      executeCommand,
    ) => {
      if (isTargetConfig(targetConfig)) {
        await target.publish(
          config,
          pkg,
          targetConfig,
          packageVersions,
          executeCommand,
        );
        return true;
      }
      return null;
    },
  };
}
