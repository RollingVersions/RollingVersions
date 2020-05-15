import {
  Connection,
  getPullRequestCommentID,
  insertPullRequest,
  updatePullRequest,
  setPullRequestSubmittedAtSha,
  insertChangeLogEntries,
} from '../../services/postgres';
import {
  GitHubClient,
  getPullRequestFromGraphID,
  getPullRequestFromNumber,
} from '../../services/github';
import getPullRequestStateFromComment from './getPullRequestStateFromComment';
import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';

export default async function upsertPullRequest(
  db: Connection,
  client: GitHubClient,
  repositoryId: number,
  repo: {owner: string; name: string},
  pullRequestId: string | number,
) {
  const pr =
    typeof pullRequestId === 'string'
      ? await getPullRequestFromGraphID(client, pullRequestId)
      : await getPullRequestFromNumber(client, repo, pullRequestId);
  if (!pr) {
    throw new Error(`Unable to load the requested pull request`);
  }
  const existingPr = await getPullRequestCommentID(db, repositoryId, pr.id);
  if (existingPr) {
    await updatePullRequest(db, repositoryId, {
      ...pr,
    });
    return {...pr, commentID: existingPr.commentID};
  } else {
    // by reading (and writing) state to the actual pull request itself (via a comment)
    // we can ensure that RollingVersions state is persisted even if Rolling Versions is
    // removed from the repository
    const {state, commentID} = await getPullRequestStateFromComment(client, {
      ...pr,
      repo,
    });
    await db.tx(async (tx) => {
      await insertPullRequest(tx, repositoryId, {
        ...pr,
      });
      if (state) {
        await setPullRequestSubmittedAtSha(
          tx,
          repositoryId,
          pr.id,
          state.submittedAtCommitSha,
        );
        await insertChangeLogEntries(
          tx,
          pr.id,
          [...state.packages]
            .flatMap(([package_name, changeSet]) =>
              ChangeTypes.flatMap((kind) =>
                changeSet[kind].map((changeLogEntry) => ({
                  package_name,
                  kind,
                  title: changeLogEntry.title,
                  body: changeLogEntry.body,
                })),
              ),
            )
            .map((cle, sort_order_weight) => ({...cle, sort_order_weight})),
        );
      }
    });
    return {...pr, commentID};
  }
}
