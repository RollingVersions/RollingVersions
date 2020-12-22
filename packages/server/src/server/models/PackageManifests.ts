import DbGitCommit from '@rollingversions/db/git_commits';
import {PackageManifestRecords_InsertParameters} from '@rollingversions/db/package_manifest_records';
import {PackageDependencyRecords_InsertParameters} from '@rollingversions/db/package_dependency_records';
import listPackages from 'rollingversions/lib/utils/listPackages';
import {getAllFiles} from 'rollingversions/lib/services/github';
import {
  PackageManifest,
  PackageDependencies,
  PublishTarget,
} from 'rollingversions/lib/types';
import dedupeByKey from '../../utils/dedupeByKey';
import ServerContext from '../ServerContext';

export type PackageManifests = Map<
  string,
  {
    manifests: PackageManifest[];
    dependencies: PackageDependencies;
  }
>;

const dedupe = dedupeByKey<DbGitCommit['id'], PackageManifests>();

export async function getPackageManifests(
  ctx: ServerContext,
  commitID: DbGitCommit['id'],
): Promise<PackageManifests> {
  return dedupe(commitID, async () => {
    const commit = await ctx.git_commits.findOne({id: commitID});
    if (!commit) {
      // unable to find the commit, assume no packages
      ctx.warning(
        'missing_commit_packages',
        `Unable to load packages for commit ${commitID} because it does not exist in the database.`,
      );
      return new Map();
    }

    if (commit.has_package_manifests) {
      return await getPackageManifestsFromPostgres(ctx, commit);
    }

    const repo = (await ctx.git_repositories.findOne({
      id: commit.git_repository_id,
    }))!;

    const packages = await listPackages(
      getAllFiles(
        await ctx.getGitHubClient(),
        {owner: repo.owner, name: repo.name},
        commit.graphql_id,
      ),
    );

    // No need to wait for this cache to be updated, we also
    // want to ignore conflict errors that could happen from
    // two processes writing package manifests at the same
    // time.
    writePackageManifestsToPostgres(ctx, commit, packages).catch((ex) => {
      ctx.error('error_writing_package_manifests', ex.stack);
    });

    return packages;
  });
}

async function getPackageManifestsFromPostgres(
  ctx: ServerContext,
  commit: DbGitCommit,
): Promise<
  Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >
> {
  const result = new Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >();
  for (const pi of await ctx.package_manifest_records
    .find({
      git_commit_id: commit.id,
    })
    .all()) {
    const manifest: PackageManifest = {
      path: pi.file_path,
      packageName: pi.package_name,
      notToBePublished: pi.not_to_be_published,
      targetConfig: {type: pi.publish_target, ...pi.target_config},
    };
    const record = result.get(pi.package_name);
    if (record) {
      record.manifests.push(manifest);
    } else {
      result.set(manifest.packageName, {
        manifests: [manifest],
        dependencies: {
          required: [],
          optional: [],
          development: [],
        },
      });
    }
  }
  for (const d of await ctx.package_dependency_records
    .find({
      git_commit_id: commit.id,
    })
    .all()) {
    const record = result.get(d.package_name);
    if (record) {
      record.dependencies[d.kind].push(d.dependency_name);
    }
  }
  return result;
}

async function writePackageManifestsToPostgres(
  ctx: ServerContext,
  commit: DbGitCommit,
  packages: Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >,
): Promise<void> {
  await ctx.tx(async (ctx) => {
    const manifests = [...packages.values()].flatMap((p) =>
      p.manifests.map(
        (pkg): PackageManifestRecords_InsertParameters => ({
          git_commit_id: commit.id,

          file_path: pkg.path,
          not_to_be_published: pkg.notToBePublished,
          package_name: pkg.packageName,
          publish_access:
            // TODO: remove this field from the database?
            pkg.targetConfig.type === PublishTarget.npm
              ? pkg.targetConfig.publishConfigAccess
              : 'unknown',
          publish_target: pkg.targetConfig.type,
          target_config: pkg.targetConfig,
        }),
      ),
    );
    if (manifests.length) {
      await ctx.package_manifest_records.insertOrIgnore(...manifests);
    }
    const dependencies = [...packages].flatMap(
      ([packageName, {dependencies}]) =>
        (['required', 'optional', 'development'] as const).flatMap((kind) =>
          dependencies[kind].map(
            (dependency_name): PackageDependencyRecords_InsertParameters => ({
              git_commit_id: commit.id,

              package_name: packageName,
              kind,
              dependency_name,
            }),
          ),
        ),
    );
    if (dependencies.length) {
      await ctx.package_dependency_records.insertOrIgnore(...dependencies);
    }
    await ctx.git_commits.update(
      {id: commit.id, has_package_manifests: false},
      {has_package_manifests: true},
    );
  });
}