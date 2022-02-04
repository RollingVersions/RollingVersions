import {
  getDataLoadersForContextType,
  transformMapKey,
} from '@mavenoid/dataloader';

import {
  Queryable,
  sql,
  tables,
  DbGitRepository,
  DbReleaseDescription,
} from '@rollingversions/db';

const {batchWithoutCache} = getDataLoadersForContextType<Queryable>();
type Key = {
  repoId: DbGitRepository['id'];
  packageName: string;
  currentVersion: string;
};
const getReleaseDescriptionRecord = batchWithoutCache<
  Key,
  DbReleaseDescription
>(async (keys, db) => {
  const descriptions = await tables.release_descriptions(db).untypedQuery(sql`
    SELECT rd.*
    FROM release_descriptions AS rd
    INNER JOIN (
      SELECT
        UNNEST(${keys.map((k) => k.repoId)}::BIGINT[]) AS git_repository_id,
        UNNEST(${keys.map((k) => k.packageName)}::TEXT[]) AS package_name,
        UNNEST(${keys.map((k) => k.currentVersion)}::TEXT[]) AS current_version
    ) AS q ON (
      q.git_repository_id = rd.git_repository_id
      AND q.package_name = rd.package_name
      AND q.current_version = rd.current_version
    )
  `);
  return transformMapKey(
    new Map(
      descriptions.map((rd) => [
        JSON.stringify([
          rd.git_repository_id,
          rd.package_name,
          rd.current_version,
        ]),
        rd,
      ]),
    ),
  )((k) => JSON.stringify([k.repoId, k.packageName, k.currentVersion]));
});

export async function getReleaseDescription(
  db: Queryable,
  repo: DbGitRepository,
  options: {
    packageName: string;
    currentVersion: string;
  },
) {
  return (
    (await getReleaseDescriptionRecord({repoId: repo.id, ...options}, db))
      ?.release_description ?? ``
  );
}
export async function setReleaseDescription(
  db: Queryable,
  repo: DbGitRepository,
  {
    packageName,
    currentVersion,
    releaseDescription,
  }: {packageName: string; currentVersion: string; releaseDescription: string},
) {
  await tables
    .release_descriptions(db)
    .insertOrUpdate([`git_repository_id`, `package_name`, `current_version`], {
      git_repository_id: repo.id,
      package_name: packageName,
      current_version: currentVersion,
      release_description: releaseDescription,
      updated_at: new Date(),
    });
}
