import {Repository} from 'rollingversions/lib/types';
import {
  Connection,
  upsertRepository,
  getCommitIdFromSha,
  getBranch,
  writeBranch,
  upsertTag,
} from '../../services/postgres';
import {
  GitHubClient,
  getRepository,
  getDefaultBranch,
  getAllDefaultBranchCommits,
  getRepositoryPullRequestGraphIDs,
  getAllRefCommits,
} from '../../services/github';
import upsertCommits from './upsertCommits';
import upsertPullRequest from './upsertPullRequest';
import {getAllTags} from 'rollingversions/lib/services/github';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

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

  // TODO(perf): avoid reading all IDs once the initial first pass is complete
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

  const head = await upsertCommits(
    db,
    client,
    repository.id,
    {owner: repository.owner, name: repository.name},
    // TODO(perf): make first page small in case the repo is mostly up to date
    // then grow page size over time
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

  // TODO(perf): find a way to avoid doing this after the first install (maybe just cache for some time?)
  const gitTags = await getAllTags(client, repo);

  const tags = (
    await Promise.all(
      gitTags.map(async (tag) => {
        let headCommitId = await getCommitIdFromSha(
          db,
          repository.id,
          tag.commitSha,
        );
        if (!headCommitId) {
          await upsertCommits(
            db,
            client,
            repository.id,
            repo,
            getAllRefCommits(client, repo, {type: 'tag', name: tag.name}),
          );
          headCommitId = await getCommitIdFromSha(
            db,
            repository.id,
            tag.commitSha,
          );
        }
        if (headCommitId) {
          // TODO(perf): this bumps id unnecessarily
          return {
            ...tag,
            ...(await upsertTag(db, repository.id, {
              graphql_id: tag.graphql_id,
              name: tag.name,
              target_git_commit_id: headCommitId,
            })),
          };
        }
        return undefined;
      }),
    )
  ).filter(isTruthy);

  return {...repository, tags, head: head && {id: commitID, ...head}};
}
