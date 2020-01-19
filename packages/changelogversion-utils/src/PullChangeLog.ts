import {PackageInfos} from './Platforms';

export const SectionTitle: {readonly [type in ChangeType]: string} = {
  breaking: 'Breaking Changes',
  feat: 'New Features',
  refactor: 'Refactored Code',
  perf: 'Performance Improvements',
  fix: 'Bug Fixes',
};
export const Placeholder: {readonly [type in ChangeType]: string} = {
  breaking: 'Add a breaking change...',
  feat: 'Add a new feature...',
  refactor: 'Add a refactor...',
  perf: 'Add a performance improvement...',
  fix: 'Add a bug fix...',
};
export type ChangeType = 'breaking' | 'feat' | 'refactor' | 'perf' | 'fix';
export const ChangeTypes = [
  'breaking',
  'feat',
  'refactor',
  'perf',
  'fix',
] as const;
export interface ChangeLogEntry {
  readonly type: ChangeType;
  readonly title: string;
  readonly body: string;
}
export interface PackagePullChangeLog {
  readonly packageName: string;
  readonly changes: ChangeLogEntry[];
}
export default interface PullChangeLog {
  /**
   * The latest commit on the PR at the time this Change Log was submitted.
   *
   * The change log should be confirmed after each new commit.
   */
  readonly submittedAtCommitSha: string | null;
  readonly packages: PackagePullChangeLog[];
  readonly packageInfoCache?: {
    headSha: string;
    packages: PackageInfos;
  };
}
