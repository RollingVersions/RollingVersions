import {
  Connection,
  getCommitIdFromSha,
  upsertTag,
  getAllTags as getAllTagsPg,
} from '../../services/postgres';
import {GitHubClient, getAllRefCommits} from '../../services/github';
import {Repository} from 'rollingversions/lib/types';
import {getAllTags as getAllTagsGh} from 'rollingversions/lib/services/github';
import upsertCommits from './upsertCommits';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';

export default async function getAllTags(
  db: Connection,
  client: GitHubClient,
  repo: Repository & {id: number},
  {loadFromGitHub}: {loadFromGitHub: boolean},
) {
  if (loadFromGitHub) {
    const gitTags = await getAllTagsGh(client, repo);

    return (
      await Promise.all(
        gitTags.map(async (tag) => {
          let headCommitId = await getCommitIdFromSha(
            db,
            repo.id,
            tag.commitSha,
          );
          if (!headCommitId) {
            await upsertCommits(
              db,
              client,
              repo.id,
              repo,
              getAllRefCommits(client, repo, {
                type: 'tag',
                name: tag.name,
              }),
            );
            headCommitId = await getCommitIdFromSha(db, repo.id, tag.commitSha);
          }
          if (headCommitId) {
            // TODO(perf): this bumps id unnecessarily
            return {
              commitSha: tag.commitSha,
              ...(await upsertTag(db, repo.id, {
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
  } else {
    return (await getAllTagsPg(db, repo.id)).map(({commit_sha, ...tag}) => ({
      ...tag,
      commitSha: commit_sha,
    }));
  }
}
