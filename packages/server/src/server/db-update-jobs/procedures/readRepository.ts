import {Repository} from 'rollingversions/lib/types';
import {Connection, getRepository, getAllTags} from '../../services/postgres';

export default async function readRepository(db: Connection, repo: Repository) {
  const repository = await getRepository(db, repo);

  if (!repository) {
    return null;
  }

  // better to force a refresh if we don't have head branch info yet
  if (
    !(
      repository.target_git_commit_id &&
      repository.target_commit_graphql_id &&
      repository.commit_sha
    )
  ) {
    return null;
  }

  // TODO: this could be run in parallel with getting the repo via an SQL join
  const tags = (await getAllTags(db, repository.id)).map(
    ({commit_sha, ...tag}) => ({
      ...tag,
      commitSha: commit_sha,
    }),
  );

  return {
    id: repository.id,
    owner: repository.owner,
    name: repository.name,
    graphql_id: repository.graphql_id,
    tags,
    head: {
      id: repository.target_git_commit_id,
      graphql_id: repository.target_commit_graphql_id,
      commit_sha: repository.commit_sha,
    },
  };
}
