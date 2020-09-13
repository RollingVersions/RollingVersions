// WARNING: Pull Request state gets attatched to pull requests as a comment in GitHub.
//          There is no easy way to migrate this data, so the "Codecs" in this file
//          must support parsing all versions of this data that have ever existed.
//          Be very conservative with changes, and aim not to reference Codecs defined
//          in other files.
import {t, compressedObjectCodec, map} from '../utils/ValidationCodec';

export interface ChangeLogEntry {
  readonly title: string;
  readonly body: string;
}

export const ChangeLogEntryCodec: t.Codec<ChangeLogEntry> = compressedObjectCodec(
  1,
  'ChangLogEntry',
  {title: t.String, body: t.String},
  ['title', 'body'],
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

export const ChangeSetCodec: t.Codec<ChangeSet> = compressedObjectCodec(
  1,
  'ChangeSet',
  {
    breaking: t.Array(ChangeLogEntryCodec),
    feat: t.Array(ChangeLogEntryCodec),
    refactor: t.Array(ChangeLogEntryCodec),
    perf: t.Array(ChangeLogEntryCodec),
    fix: t.Array(ChangeLogEntryCodec),
  },
  ['breaking', 'feat', 'refactor', 'perf', 'fix'],
);

export default interface PullRequestState {
  /**
   * The latest commit on the PR at the time this Change Log was submitted.
   *
   * The change log should be confirmed after each new commit.
   */
  readonly submittedAtCommitSha: string | null;
  readonly packages: Map<string, ChangeSet>;
}

const PullRequestStateLegacyCodec: t.Codec<PullRequestState> = compressedObjectCodec(
  1,
  'PullRequestStateLegacy',
  {
    submittedAtCommitSha: t.Union(t.Null, t.String),
    packageInfoFetchedAt: t.Unknown,
    packages: map(
      t.String,
      compressedObjectCodec(
        1,
        'Package',
        {
          changes: ChangeSetCodec,
          info: t.Unknown,
        },
        ['changes', 'info'],
      ),
    ),
  },
  ['submittedAtCommitSha', 'packageInfoFetchedAt', 'packages'],
  // never use this for encoding
).withParser({
  parse: (v) => ({
    success: true,
    value: {
      submittedAtCommitSha: v.submittedAtCommitSha,
      packages: new Map(
        [...v.packages].map(([packageName, {changes}]) => [
          packageName,
          changes,
        ]),
      ),
    },
  }),
});

const PullRequestStateModernCodec: t.Codec<PullRequestState> = compressedObjectCodec(
  2,
  'PullRequestState',
  {
    submittedAtCommitSha: t.Union(t.Null, t.String),
    packages: map(t.String, ChangeSetCodec),
  },
  ['submittedAtCommitSha', 'packages'],
);

export const PullRequestStateCodec: t.Codec<PullRequestState> = t.Union(
  PullRequestStateLegacyCodec,
  PullRequestStateModernCodec,
);
