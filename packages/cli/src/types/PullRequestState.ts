import PackageInfo, {PackageInfoCodec} from './PackageInfo';
import {
  t,
  versionSymbol,
  compressedObjectCodec,
  map,
} from '../utils/ValidationCodec';

export interface ChangeLogEntry {
  readonly title: string;
  readonly body: string;
}

export const ChangeLogEntryCodec = compressedObjectCodec(
  1,
  'ChangLogEntry',
  {title: t.string, body: t.string},
  [versionSymbol, 'title', 'body'],
);

export interface ChangeSet<TExtra = {}> {
  breaking: (ChangeLogEntry & TExtra)[];
  feat: (ChangeLogEntry & TExtra)[];
  refactor: (ChangeLogEntry & TExtra)[];
  perf: (ChangeLogEntry & TExtra)[];
  fix: (ChangeLogEntry & TExtra)[];
}

export type ChangeType = keyof ChangeSet;
export const ChangeTypes = [
  'breaking',
  'feat',
  'refactor',
  'perf',
  'fix',
] as const;

export function isEmptyChangeSet(changes: ChangeSet) {
  return ChangeTypes.every((changeType) => changes[changeType].length === 0);
}

export const ChangeSetCodec = compressedObjectCodec(
  1,
  'ChangeSet',
  {
    breaking: t.array(ChangeLogEntryCodec),
    feat: t.array(ChangeLogEntryCodec),
    refactor: t.array(ChangeLogEntryCodec),
    perf: t.array(ChangeLogEntryCodec),
    fix: t.array(ChangeLogEntryCodec),
  },
  [versionSymbol, 'breaking', 'feat', 'refactor', 'perf', 'fix'] as const,
);

export default interface PullRequestState {
  /**
   * The latest commit on the PR at the time this Change Log was submitted.
   *
   * The change log should be confirmed after each new commit.
   */
  readonly submittedAtCommitSha: string | null;
  readonly packageInfoFetchedAt: string;
  readonly packages: Map<string, {changes: ChangeSet; info: PackageInfo[]}>;
}

export const PullRequestStateCodec = compressedObjectCodec(
  1,
  'PullRequestState',
  {
    submittedAtCommitSha: t.union([t.null, t.string]),
    packageInfoFetchedAt: t.string,
    packages: map(
      t.string,
      compressedObjectCodec(
        1,
        'Package',
        {
          changes: ChangeSetCodec,
          info: t.array(PackageInfoCodec),
        },
        [versionSymbol, 'changes', 'info'],
      ),
    ),
  },
  [versionSymbol, 'submittedAtCommitSha', 'packageInfoFetchedAt', 'packages'],
);
