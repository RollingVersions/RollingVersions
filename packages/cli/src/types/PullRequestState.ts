// WARNING: Pull Request state gets attatched to pull requests as a comment in GitHub.
//          There is no easy way to migrate this data, so the "Codecs" in this file
//          must support parsing all versions of this data that have ever existed.
//          Be very conservative with changes, and aim not to reference Codecs defined
//          in other files.
import {t, compressedObjectCodec, map} from '../utils/ValidationCodec';
import {ChangeSet, ChangeSetCodec} from './ChangeSet';

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
