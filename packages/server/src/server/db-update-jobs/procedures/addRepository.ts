import {Repository} from 'rollingversions/lib/types';
import {
  Connection,
  upsertRepository,
  getCommitIdFromSha,
  getBranch,
  writeBranch,
} from '../../services/postgres';
import {
  GitHubClient,
  getRepository,
  getDefaultBranch,
  getAllDefaultBranchCommits,
  getRepositoryPullRequestGraphIDs,
} from '../../services/github';
import upsertCommits from './upsertCommits';
import upsertPullRequest from './upsertPullRequest';

export default async function addRepository(
  db: Connection,
  client: GitHubClient,
  repo: Repository,
) {
  const [repository, defaultBranch] = await Promise.all([
    getRepository(client, repo),
    getDefaultBranch(client, repo),
  ]);

  if (!repository) {
    throw new Error(`Could not read the repository ${repo.owner}/${repo.name}`);
  }
  if (!defaultBranch) {
    throw new Error(
      `Could not read the default branch for ${repo.owner}/${repo.name}`,
    );
  }

  await upsertRepository(db, {
    ...repository,
    default_branch_name: defaultBranch.name,
  });
  const dbBranch = await getBranch(db, repository.id, defaultBranch.name);

  for await (const pullRequestGraphIDs of getRepositoryPullRequestGraphIDs(
    client,
    repo,
  )) {
    await Promise.all(
      pullRequestGraphIDs.map((pullRequestGraphID) =>
        upsertPullRequest(
          db,
          client,
          repository.id,
          {
            owner: repository.owner,
            name: repository.name,
          },
          pullRequestGraphID,
        ),
      ),
    );
  }

  await upsertCommits(
    db,
    client,
    repository.id,
    {owner: repository.owner, name: repository.name},
    getAllDefaultBranchCommits(client, repo),
  );

  const commitID = await getCommitIdFromSha(
    db,
    repository.id,
    defaultBranch.target,
  );
  if (!commitID) {
    throw new Error('Missing commitID for head of branch');
  }

  await writeBranch(
    db,
    repository.id,
    {
      graphql_id: defaultBranch.graphql_id,
      name: defaultBranch.name,
      target_git_commit_id: commitID,
    },
    dbBranch?.target_git_commit_id || null,
  );

  // TODO: add all tags
}
