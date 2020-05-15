import {
  Connection,
  upsertCommits as upsertCommitsPg,
  filterOutExisingPullRequestIDs,
  filterToExistingCommitShas,
} from '../../services/postgres';
import {GitHubClient, GitHubCommit} from '../../services/github';
import upsertPullRequest from './upsertPullRequest';
import {Repository} from 'rollingversions/lib/types';

export default async function upsertCommits(
  db: Connection,
  client: GitHubClient,
  repositoryId: number,
  repo: Repository,
  allCommits: AsyncGenerator<GitHubCommit[], void, unknown>,
) {
  const missingParents = new Set<string>();
  const newCommits = [];
  let headCommit;
  for await (const commits of allCommits) {
    if (!headCommit) {
      headCommit = commits[0];
    }
    const existingShas = await filterToExistingCommitShas(db, repositoryId, [
      ...commits.map((c) => c.commit_sha),
      ...commits.flatMap((c) => c.parents),
    ]);
    for (const commit of commits) {
      if (!existingShas.has(commit.commit_sha)) {
        newCommits.push(commit);
        missingParents.delete(commit.commit_sha);
        for (const parent of commit.parents) {
          if (!existingShas.has(parent)) {
            missingParents.add(parent);
          }
        }
      }
      if (missingParents.size === 0) {
        break;
      }
    }
    if (missingParents.size === 0) {
      break;
    }
  }
  if (newCommits.length === 0) {
    return headCommit;
  }

  newCommits.reverse();

  const seenPullRequests = new Set<number>();
  const newPullRequests = await filterOutExisingPullRequestIDs(
    db,
    repositoryId,
    newCommits
      .flatMap((c) => c.associatedPullRequests)
      .filter(({id}) => {
        if (seenPullRequests.has(id)) {
          return false;
        } else {
          seenPullRequests.add(id);
          return true;
        }
      }),
  );

  await Promise.all(
    newPullRequests.map(async (p) => {
      await upsertPullRequest(db, client, repositoryId, repo, p.id);
    }),
  );

  await upsertCommitsPg(db, repositoryId, newCommits);

  return headCommit;
}
