import ChangeSet from '@rollingversions/change-set';
import {inc, lt} from 'semver';

export function getVersionBump(changes: ChangeSet) {
  if (changes.some((c) => c.type === 'breaking')) {
    return 'major';
  }
  if (changes.some((c) => c.type === 'feat' || c.type === 'refactor')) {
    return 'minor';
  }
  if (changes.some((c) => c.type === 'perf' || c.type === 'fix')) {
    return 'patch';
  }
  return null;
}

export function getNewVersion(
  currentVersion: string | null,
  changes: ChangeSet,
) {
  const change = getVersionBump(changes);

  if (!change) return null;

  if (!currentVersion || lt(currentVersion, '1.0.0')) return '1.0.0';

  return inc(currentVersion, change);
}
