import {Repository} from 'rollingversions/lib/types';
import {Queryable, getAllUnreleasedChanges} from '../../services/postgres';
import {GitHubClient} from '../../services/github';
import addRepository from '../procedures/addRepository';
import addPackageVersions from 'rollingversions/lib/utils/addPackageVersions';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import {Logger} from '../../logger';
import {
  getCurrentVerion,
  getNewVersion,
} from 'rollingversions/lib/utils/Versioning';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import {PackageStatusDetail} from 'rollingversions/lib/utils/getPackageStatuses';
import {getPackageManifests} from '../../models/PackageManifests';
import {createChangeSet} from '@rollingversions/change-set';

export default async function readRepositoryState(
  db: Queryable,
  client: GitHubClient,
  repository: Repository,
  logger: Logger,
) {
  const addRepositoryTimer = logger.withTimer();
  const repo = await addRepository(
    db,
    client,
    repository,
    {
      refreshPRs: false,
      refreshTags: true,
      refreshPrAssociations: true,
    },
    logger,
  );

  addRepositoryTimer.info('add_repository', 'Ran add repository');

  const getPackageManifestsTimer = logger.withTimer();

  const packages = await getPackageManifests(
    db,
    client,
    repo.head.id,
    logger,
  ).then((packages) => addPackageVersions(packages, repo.tags));

  getPackageManifestsTimer.info('get_manifests', 'Got package manifets');

  const commitIDs = new Map<string, number>(
    repo.tags.map((tag) => [tag.commitSha, tag.target_git_commit_id]),
  );
  return await Promise.all(
    [...packages].map(
      async ([
        packageName,
        {manifests, dependencies},
      ]): Promise<PackageStatusDetail> => {
        const currentVersion = getCurrentVerion(manifests);

        const releasedShas = new Set(
          manifests.map((m) => m.versionTag?.commitSha).filter(isTruthy),
        );
        const releasedIDs = [...releasedShas]
          .map((sha) => commitIDs.get(sha))
          .filter(isTruthy);
        const changeSet = createChangeSet<{
          id: number;
          weight: number;
          pr: number;
        }>(
          ...(
            await getAllUnreleasedChanges(db, {
              headCommitID: repo.head.id,
              lastReleaseCommitIDs: releasedIDs,
              packageName,
            })
          ).map((change) => ({
            type: change.kind,
            id: change.id,
            weight: change.sort_order_weight,
            title: change.title,
            body: change.body,
            pr: change.pr_number,
          })),
        );
        const newVersion = getNewVersion(currentVersion, changeSet);
        if (!newVersion) {
          return {
            status: PackageStatus.NoUpdateRequired,
            currentVersion,
            newVersion: currentVersion,
            packageName,
            manifests: manifests,
            dependencies,
          };
        }

        return {
          status: PackageStatus.NewVersionToBePublished,
          currentVersion,
          newVersion,
          packageName,
          changeSet,
          manifests: manifests,
          dependencies,
        };
      },
    ),
  );
}
