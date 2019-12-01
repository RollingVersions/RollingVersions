export const SectionTitle: {[type in ChangeType]: string} = {
  breaking: 'Breaking Changes',
  feat: 'New Features',
  refactor: 'Refactored Code',
  perf: 'Performance Improvements',
  fix: 'Bug Fixes',
};
export type ChangeType = 'breaking' | 'feat' | 'refactor' | 'perf' | 'fix';
export interface ChangeLogEntry {
  type: ChangeType;
  title: string;
  body: string;
}
export interface PackagePullChangeLog {
  packageName: string;
  changes: ChangeLogEntry[];
}
export default interface PullChangeLog {
  submitted: boolean;
  packages: PackagePullChangeLog[];
}
