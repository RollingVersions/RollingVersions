import {inc} from 'semver';
import {ChangeLogEntry} from './PullChangeLog';

export function getNewVersion(
  currentVersion: string | null,
  changes: readonly Pick<ChangeLogEntry, 'type'>[],
) {
  if (!currentVersion) {
    return changes.length ? '1.0.0' : null;
  }
  if (changes.some((c) => c.type === 'breaking')) {
    return inc(currentVersion, 'major');
  }
  if (changes.some((c) => c.type === 'feat' || c.type === 'refactor')) {
    return inc(currentVersion, 'minor');
  }
  if (changes.some((c) => c.type === 'fix' || c.type === 'perf')) {
    return inc(currentVersion, 'patch');
  }
  return null;
}
