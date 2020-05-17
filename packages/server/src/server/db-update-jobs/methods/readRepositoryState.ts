import {Repository} from 'rollingversions/lib/types';
import {
  Connection,
  getCommitIdFromSha,
  getAllUnreleasedChanges,
} from '../../services/postgres';
import {GitHubClient} from '../../services/github';
import addRepository from '../procedures/addRepository';
import getPackageManifests from '../procedures/getPackageManifests';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import addPackageVersions from 'rollingversions/lib/utils/addPackageVersions';
import isTruthy from 'rollingversions/lib/ts-utils/isTruthy';
import log from '../../logger';
import {
  getCurrentVerion,
  getNewVersion,
} from 'rollingversions/lib/utils/Versioning';
import PackageStatus from 'rollingversions/lib/types/PackageStatus';
import {PackageStatusDetail} from 'rollingversions/lib/utils/getPackageStatuses';

export default async function readRepositoryState(
  db: Connection,
  client: GitHubClient,
  repository: Repository,
) {
  let start = Date.now();
  const repo = await addRepository(db, client, repository, {
    refreshPRs: false,
    refreshTags: true,
  });

  log({
    event_type: 'add_repository',
    message: 'Ran add repository',
    event_status: 'ok',
    duration: Date.now() - start,
  });

  start = Date.now();

  const packages = await getPackageManifests(
    db,
    client,
    repo,
    repo.head,
  ).then((packages) => addPackageVersions(packages, repo.tags));

  log({
    event_type: 'get_manifests',
    message: 'Got package manifets',
    event_status: 'ok',
    duration: Date.now() - start,
  });
  start = Date.now();

  const commitIDs = new Map<string, Promise<number | null>>();
  return await Promise.all(
    [...packages].map(
      async ([packageName, {manifests, dependencies}]): Promise<
        PackageStatusDetail
      > => {
        const currentVersion = getCurrentVerion(manifests);
        const currentTag = currentVersion
          ? manifests.find(
              (manifest) => manifest.versionTag?.version === currentVersion,
            )?.versionTag
          : null;
        if (currentVersion && !currentTag) {
          return {
            status: PackageStatus.MissingTag,
            packageName,
            currentVersion,
            manifests: manifests,
            dependencies,
          };
        }

        const releasedShas = new Set(
          manifests.map((m) => m.versionTag?.commitSha).filter(isTruthy),
        );
        const releasedIDs = (
          await Promise.all(
            [...releasedShas].map(async (sha) => {
              const cached = commitIDs.get(sha);
              if (cached) return cached;
              const result = getCommitIdFromSha(db, repo.id, sha);
              commitIDs.set(sha, result);
              return result;
            }),
          )
        ).filter(isTruthy);
        const changeSet = getEmptyChangeSet<{
          id: number;
          weight: number;
          pr: number;
        }>();
        for (const change of await getAllUnreleasedChanges(db, {
          headCommitID: repo.head.id,
          lastReleaseCommitIDs: releasedIDs,
          packageName,
        })) {
          changeSet[change.kind].push({
            id: change.id,
            weight: change.sort_order_weight,
            title: change.title,
            body: change.body,
            pr: change.pr_number,
          });
        }
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
