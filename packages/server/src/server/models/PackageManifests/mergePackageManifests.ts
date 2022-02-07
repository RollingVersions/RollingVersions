import {inspect} from 'util';

import deepEqual from 'deep-equal';

import {parseRollingConfigOptions} from '@rollingversions/config';
import {PackageManifest} from '@rollingversions/types';

import mergePackageDependencies from './mergePackageDependencies';

const failed = (reason: string): {ok: false; reason: string} => ({
  ok: false,
  reason,
});
export default function mergePackageManifests(
  a: PackageManifest,
  b: PackageManifest,
): {ok: true; manifest: PackageManifest} | {ok: false; reason: string} {
  if (a.packageName !== b.packageName) {
    return failed(
      `Cannot merge two package manifests with different names: "${a.packageName}" and "${b.packageName}"`,
    );
  }
  const customized = [...new Set([...a.customized, ...b.customized])];
  const rawConfig: any = {};
  for (const key of customized) {
    if (a.customized.includes(key) && b.customized.includes(key)) {
      if (deepEqual(a[key], b[key])) {
        rawConfig[key] = a[key];
      } else {
        return failed(
          `Cannot use two different ${key} for "${a.packageName}": "${inspect(
            a[key],
          )}" and "${inspect(b[key])}"`,
        );
      }
    } else if (a.customized.includes(key)) {
      rawConfig[key] = a[key];
    } else {
      rawConfig[key] = b[key];
    }
  }
  const config = parseRollingConfigOptions(rawConfig);
  if (!config.success) {
    return {ok: false, reason: config.reason};
  }
  return {
    ok: true,
    manifest: {
      ...config.value,
      customized,
      packageName: a.packageName,
      dependencies: mergePackageDependencies(a.dependencies, b.dependencies),
      targetConfigs: [...a.targetConfigs, ...b.targetConfigs],
      scripts: {
        pre_release: [...a.scripts.pre_release, ...b.scripts.pre_release],
        post_release: [...a.scripts.post_release, ...b.scripts.post_release],
      },
    },
  };
}
