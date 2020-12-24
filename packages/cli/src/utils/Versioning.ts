import {inc, lt} from 'semver';
import {ChangeSet} from '../types';

// TODO: represent version as number[] instead of major/minor/patch
// TODO: make the following configureable:

// version_parts = ["major", "minor", "patch"]
// tag_format = "{{package_name}}@{{major}}.{{minor}}.{{patch}}"
// [change_types.breaking]
//   bumps = "major"
//   plural = "Breaking Changes"
//   singular = "Breaking Change"
// [change_types.feat]
//   bumps = "minor"
//   plural = "New Features"
//   singular = "New Feature"
// [change_types.refactor]
//   bumps = "minor"
//   plural = "Refactorings"
//   singular = "Refactor"
// [change_types.perf]
//   bumps = "patch"
//   plural = "Performance Improvements"
//   singualr = "Performance Improvement"
// [change_types.fix]
//   bumps = "patch"
//   plural = "Bug Fixes"
//   singular = "Bug Fix"

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

// export function getCurrentVerion(
//   currentVersions: PackageManifestWithVersion[],
// ) {
//   const versionNumbers = currentVersions
//     .map((v) => v.registryVersion || v.versionTag?.version)
//     .filter(<T>(v: T): v is Exclude<T, undefined> => v !== undefined);
//   if (versionNumbers.length === 0) return null;

//   const maxVersion = currentVersions
//     .map((v) => v.registryVersion || v.versionTag?.version)
//     .filter(<T>(v: T): v is Exclude<T, undefined> => v !== undefined)
//     .reduce((a, b) => (gt(a, b) ? a : b), '0.0.0');

//   return maxVersion;
// }

export function getNewVersion(
  currentVersion: string | null,
  changes: ChangeSet,
) {
  const change = getVersionBump(changes);

  if (!change) return null;
  if (!currentVersion || lt(currentVersion, '1.0.0')) return '1.0.0';
  return inc(currentVersion, change);
}
