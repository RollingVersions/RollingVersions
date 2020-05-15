import PackageManifest, {PackageManifestCodec} from './PackageManifest';
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

export const ChangeLogEntryCodec = compressedObjectCodec<ChangeLogEntry>()(
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

export const ChangeSetCodec = compressedObjectCodec<ChangeSet>()(
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

interface PullRequestStateLegacy {
  /**
   * The latest commit on the PR at the time this Change Log was submitted.
   *
   * The change log should be confirmed after each new commit.
   */
  readonly submittedAtCommitSha: string | null;
  readonly packageInfoFetchedAt: string;
  readonly packages: Map<string, {changes: ChangeSet; info: PackageManifest[]}>;
}
export default interface PullRequestState {
  /**
   * The latest commit on the PR at the time this Change Log was submitted.
   *
   * The change log should be confirmed after each new commit.
   */
  readonly submittedAtCommitSha: string | null;
  readonly packages: Map<string, ChangeSet>;
}

const PullRequestStateLegacyCodec = compressedObjectCodec<
  PullRequestStateLegacy
>()(
  1,
  'PullRequestStateLegacy',
  {
    submittedAtCommitSha: t.union([t.null, t.string]),
    packageInfoFetchedAt: t.string,
    packages: map(
      t.string,
      compressedObjectCodec<{changes: ChangeSet; info: PackageManifest[]}>()(
        1,
        'Package',
        {
          changes: ChangeSetCodec,
          info: t.array(PackageManifestCodec),
        },
        [versionSymbol, 'changes', 'info'],
      ),
    ),
  },
  [versionSymbol, 'submittedAtCommitSha', 'packageInfoFetchedAt', 'packages'],
).pipe(
  new t.Type<PullRequestState, PullRequestStateLegacy, PullRequestStateLegacy>(
    'PullRequestStateLegacy',
    // never use this for encoding
    (_v: any): _v is PullRequestState => false,
    (v) =>
      t.success({
        submittedAtCommitSha: v.submittedAtCommitSha,
        packages: new Map(
          [...v.packages].map(([packageName, {changes}]) => [
            packageName,
            changes,
          ]),
        ),
      }),
    () => {
      throw new Error('Encoding to the legacy encoding is not supported');
    },
  ),
);

const PullRequestStateModernCodec = compressedObjectCodec<PullRequestState>()(
  2,
  'PullRequestState',
  {
    submittedAtCommitSha: t.union([t.null, t.string]),
    packages: map(t.string, ChangeSetCodec),
  },
  [versionSymbol, 'submittedAtCommitSha', 'packages'],
);

export const PullRequestStateCodec = t.union([
  PullRequestStateLegacyCodec,
  PullRequestStateModernCodec,
]);
