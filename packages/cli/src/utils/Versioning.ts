import ChangeSet from '@rollingversions/change-set';
import {inc, gt, lt} from 'semver';
import {PackageManifestWithVersion} from '../types';

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

export function getCurrentVerion(
  currentVersions: PackageManifestWithVersion[],
) {
  const versionNumbers = currentVersions
    .map((v) => v.versionTag?.version)
    .filter(<T>(v: T): v is Exclude<T, undefined> => v !== undefined);

  if (versionNumbers.length === 0) return null;

  const maxVersion = versionNumbers.reduce((a, b) => (gt(a, b) ? a : b));

  return maxVersion;
}

export function getNewVersion(
  currentVersionsOrCurrentVersion: PackageManifestWithVersion[] | string | null,
  changes: ChangeSet,
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
