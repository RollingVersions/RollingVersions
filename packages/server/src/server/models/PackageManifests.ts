import type {Queryable} from '@rollingversions/db';
import {tables} from '@rollingversions/db';
import type DbGitCommit from '@rollingversions/db/git_commits';
import type {PackageManifestRecordsV2_InsertParameters as InsertParameters} from '@rollingversions/db/package_manifest_records_v2';
import {getAllFiles} from 'rollingversions/lib/services/github';
import type {PackageManifest} from 'rollingversions/lib/types';
import listPackages from 'rollingversions/lib/utils/listPackages';

import dedupeByKey from '../../utils/dedupeByKey';
import type {Logger} from '../logger';
import type {GitHubClient} from '../services/github';

export type PackageManifests = Map<string, PackageManifest>;

const dedupe = dedupeByKey<DbGitCommit['id'], PackageManifests>();

// use this to invalidate the cache if the type of PackageManifest changes
const SCHEMA_VERSION = 2;

export async function getPackageManifests(
  db: Queryable,
  client: GitHubClient,
  commitID: DbGitCommit['id'],
  logger: Logger,
): Promise<PackageManifests> {
  return await dedupe(commitID, async () => {
    const commit = await tables.git_commits(db).findOne({id: commitID});
    if (!commit) {
      // unable to find the commit, assume no packages
      logger.warning(
        'missing_commit_packages',
        `Unable to load packages for commit ${commitID} because it does not exist in the database.`,
      );
      return new Map();
    }

    if (commit.package_manifests_loaded_version === SCHEMA_VERSION) {
      return await getPackageManifestsFromPostgres(db, commit);
    }

    const repo = (await tables.git_repositories(db).findOne({
      id: commit.git_repository_id,
    }))!;

    const packages = await listPackages(
      getAllFiles(
        client,
        {owner: repo.owner, name: repo.name},
        commit.graphql_id,
      ),
    );

    // No need to wait for this cache to be updated, we also
    // want to ignore conflict errors that could happen from
    // two processes writing package manifests at the same
    // time.
    writePackageManifestsToPostgres(db, commit, packages).catch((ex) => {
      logger.error('error_writing_package_manifests', ex.stack);
    });

    return packages;
  });
}

async function getPackageManifestsFromPostgres(
  db: Queryable,
  commit: DbGitCommit,
): Promise<Map<string, PackageManifest>> {
  return new Map(
    (
      await tables
        .package_manifest_records_v2(db)
        .find({git_commit_id: commit.id, schema_version: SCHEMA_VERSION})
        .all()
    ).map((pkg) => [pkg.package_name, pkg.manifest]),
  );
}

async function writePackageManifestsToPostgres(
  db: Queryable,
  commit: DbGitCommit,
  packages: Map<string, PackageManifest>,
): Promise<void> {
  await db.tx(async (db) => {
    const commitBefore = await tables.git_commits(db).findOne({id: commit.id});
    if (!commitBefore) return;
    if (commitBefore.package_manifests_loaded_version === SCHEMA_VERSION) {
      return;
    }
    const manifests = [...packages.values()].map(
      (pkg): InsertParameters => ({
        git_commit_id: commit.id,
        package_name: pkg.packageName,
        schema_version: SCHEMA_VERSION,
        manifest: pkg,
      }),
    );
    if (manifests.length) {
      await tables.package_manifest_records_v2(db).insertOrIgnore(...manifests);
    }
    await tables.git_commits(db).update(
      {
        id: commit.id,
        package_manifests_loaded_version:
          commitBefore.package_manifests_loaded_version,
      },
      {package_manifests_loaded_version: SCHEMA_VERSION},
    );
  });
}
