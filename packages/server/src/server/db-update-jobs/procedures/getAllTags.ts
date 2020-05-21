import {
  Connection,
  getCommitIdFromSha,
  upsertTag,
  getAllTags as getAllTagsPg,
} from '../../services/postgres';
import {GitHubClient, getCommitHistory} from '../../services/github';
import {Repository} from 'rollingversions/lib/types';
import {getAllTags as getAllTagsGh} from 'rollingversions/lib/services/github';
import upsertCommits from './upsertCommits';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import log from '../../logger';

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
              getCommitHistory(client, tag.commitGraphId),
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
          } else {
            log({
              event_status: 'error',
              event_type: 'missing_tag_head',
              message: `Missing git tag head for ${tag.name}`,
              repo_owner: repo.owner,
              repo_name: repo.name,
              ...tag,
            });
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
