import {inc, gt, lt} from 'semver';
import {ChangeSet, PackageManifestWithVersion} from '../types';

export function getVersionBump(changes: ChangeSet) {
  if (changes.breaking.length) {
    return 'major';
  }
  if (changes.feat.length || changes.refactor.length) {
    return 'minor';
  }
  if (changes.fix.length || changes.perf.length) {
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
