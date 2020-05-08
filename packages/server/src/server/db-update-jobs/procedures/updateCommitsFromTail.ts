import {Repository} from 'rollingversions/lib/types';
import {Connection, upsertRepository} from '../../services/postgres';
import {
  GitHubClient,
  getRepository,
  getDefaultBranch,
  getAllDefaultBranchCommitsFromTail,
} from '../../services/github';

export async function updateCommitsFromTail(
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
  for await (const commit of getAllDefaultBranchCommitsFromTail(client, repo)) {
    console.info(commit);
  }
}
