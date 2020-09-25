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
import {Logger} from '../../logger';

export default async function getAllTags(
  db: Connection,
  client: GitHubClient,
  repo: Repository & {id: number},
  {loadFromGitHub}: {loadFromGitHub: boolean},
  logger: Logger,
) {
  if (loadFromGitHub) {
    const [pgTagsByGraphID, gitTags] = await Promise.all([
      getAllTagsPg(db, repo.id).then(
        (pgTags) => new Map(pgTags.map((tag) => [tag.graphql_id, tag])),
      ),
      getAllTagsGh(client, repo),
    ]);

    return (
      await Promise.all(
        gitTags.map(async (tag) => {
          const pgTag = pgTagsByGraphID.get(tag.graphql_id);
          if (
            pgTag &&
            pgTag.commit_sha === tag.commitSha &&
            pgTag.name === tag.name
          ) {
            return {
              id: pgTag.id,
              graphql_id: pgTag.graphql_id,
              name: pgTag.name,
              target_git_commit_id: pgTag.target_git_commit_id,
              commitSha: pgTag.commit_sha,
            };
          }
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
              {forceFullScan: false},
              logger,
            );
            headCommitId = await getCommitIdFromSha(db, repo.id, tag.commitSha);
          }
          if (headCommitId) {
            return {
              commitSha: tag.commitSha,
              ...(await upsertTag(db, repo.id, {
                graphql_id: tag.graphql_id,
                name: tag.name,
                target_git_commit_id: headCommitId,
              })),
            };
          } else {
            logger.error(
              'missing_tag_head',
              `Missing git tag head for ${tag.name}`,
              {
                repo_owner: repo.owner,
                repo_name: repo.name,
                ...tag,
              },
            );
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
