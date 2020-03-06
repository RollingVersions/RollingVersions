import {inc, gt, lt} from 'semver';
import {ChangeLogEntry} from './PullChangeLog';
import {PackageInfo} from './Platforms';

export function getVersionBump(
  changes: readonly Pick<ChangeLogEntry, 'type'>[],
) {
  if (changes.some((c) => c.type === 'breaking')) {
    return 'major';
  }
  if (changes.some((c) => c.type === 'feat' || c.type === 'refactor')) {
    return 'minor';
  }
  if (changes.some((c) => c.type === 'fix' || c.type === 'perf')) {
    return 'patch';
  }
  return null;
}

export function getCurrentVerion(currentVersions: PackageInfo[]) {
  const versionNumbers = currentVersions
    .map((v) => v.registryVersion || v.versionTag?.version)
    .filter(<T>(v: T): v is Exclude<T, undefined> => v !== undefined);
  if (versionNumbers.length === 0) return null;

  const maxVersion = currentVersions
    .map((v) => v.registryVersion || v.versionTag?.version)
    .filter(<T>(v: T): v is Exclude<T, undefined> => v !== undefined)
    .reduce((a, b) => (gt(a, b) ? a : b), '0.0.0');

  return maxVersion;
}
export function getNewVersion(
  currentVersionsOrCurrentVersion: PackageInfo[] | string | null,
  changes: readonly Pick<ChangeLogEntry, 'type'>[],
) {
  const change = getVersionBump(changes);

  if (!change) return null;

  const maxVersion =
    typeof currentVersionsOrCurrentVersion === 'string' ||
    currentVersionsOrCurrentVersion === null
      ? currentVersionsOrCurrentVersion
      : getCurrentVerion(currentVersionsOrCurrentVersion);

  if (!maxVersion || lt(maxVersion, '1.0.0')) return '1.0.0';

  return inc(maxVersion, change);
}
