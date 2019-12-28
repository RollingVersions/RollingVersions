import {inc, gt} from 'semver';
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

export function getNewVersion(
  currentVersion: PackageInfo[],
  changes: readonly Pick<ChangeLogEntry, 'type'>[],
) {
  const change = getVersionBump(changes);

  if (!change) return null;
  if (!currentVersion.length) return '1.0.0';

  const maxVersion = currentVersion
    .map((v) => v.registryVersion || v.versionTag?.version)
    .filter(<T>(v: T): v is Exclude<T, undefined> => v !== undefined)
    .reduce((a, b) => (gt(a, b) ? a : b));

  return change ? inc(maxVersion, change) : null;
}
