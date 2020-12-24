import {PrePublishResult} from '../types';
import PackageManifest from '../types/PackageManifest';
import {PublishConfig} from '../types/publish';
import {PublishTargetConfig} from '../types/PublishTarget';
import Release from '../types/Release';

export interface BaseTargetConfig<T extends PublishTargetConfig> {
  type: T['type'];
  pathMayContainPackage(filename: string): boolean;
  getPackageManifest(
    path: string,
    content: string,
  ): Promise<PackageManifest | null>;
  prepublish(
    config: PublishConfig,
    targetConfig: T,
    release: Release,
    packageVersions: Map<string, string | null>,
  ): Promise<PrePublishResult>;
  publish(
    config: PublishConfig,
    targetConfig: T,
    release: Release,
    packageVersions: Map<string, string | null>,
  ): Promise<void>;
}

export interface BaseTarget {
  pathMayContainPackage(filename: string): boolean;
  getPackageManifest(
    path: string,
    content: string,
  ): Promise<PackageManifest | null>;
  prepublish(
    config: PublishConfig,
    targetConfig: PublishTargetConfig,
    release: Release,
    packageVersions: Map<string, string | null>,
  ): Promise<PrePublishResult | null>;
  publish(
    config: PublishConfig,
    targetConfig: PublishTargetConfig,
    release: Release,
    packageVersions: Map<string, string | null>,
  ): Promise<null | true>;
}

export default function createPublishTargetAPI<T extends PublishTargetConfig>(
  target: BaseTargetConfig<T>,
): BaseTarget {
  function isTargetConfig(config: PublishTargetConfig): config is T {
    return config.type === target.type;
  }
  return {
    pathMayContainPackage: target.pathMayContainPackage,
    getPackageManifest: target.getPackageManifest,
    prepublish: (config, targetConfig, release, packageVersions) => {
      return isTargetConfig(targetConfig)
        ? target.prepublish(config, targetConfig, release, packageVersions)
        : Promise.resolve(null);
    },
    publish: async (config, targetConfig, release, packageVersions) => {
      if (isTargetConfig(targetConfig)) {
        await target.publish(config, targetConfig, release, packageVersions);
        return true;
      }
      return null;
    },
  };
}
