import {
  Connection,
  getPackageManifests as getPackageManifestsPg,
  writePackageManifest,
} from '../../services/postgres';
import {GitHubClient} from '../../services/github';
import listPackages from 'rollingversions/lib/utils/listPackages';
import {getAllFiles} from 'rollingversions/lib/services/github';
import {PackageManifest, PackageDependencies} from 'rollingversions/lib/types';
import log from '../../logger';

export default async function getPackageManifests(
  db: Connection,
  client: GitHubClient,
  repo: {owner: string; name: string},
  commit: {id: number; graphql_id: string},
): Promise<
  Map<
    string,
    {
      manifests: PackageManifest[];
      dependencies: PackageDependencies;
    }
  >
> {
  const existing = await getPackageManifestsPg(db, commit.id);
  if (existing) {
    const {packageManifests, dependencies} = existing;
    const result = new Map<
      string,
      {
        manifests: PackageManifest[];
        dependencies: PackageDependencies;
      }
    >();
    for (const pi of packageManifests) {
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
    for (const d of dependencies) {
      const record = result.get(d.package_name);
      if (record) {
        record.dependencies[d.kind].push(d.dependency_name);
      }
    }
    return result;
  }
  const packages = await listPackages(
    getAllFiles(client, repo, commit.graphql_id),
  );

  // no need to wait for this cache to be updated
  writePackageManifest(
    db,
    commit.id,
    [...packages.values()].flatMap((p) =>
      p.manifests.map((pi) => ({
        file_path: pi.path,
        package_name: pi.packageName,
        not_to_be_published: pi.notToBePublished,
        target_config: pi.targetConfig,
      })),
    ),
    [...packages].flatMap(([packageName, {dependencies}]) =>
      (['required', 'optional', 'development'] as const).flatMap((kind) =>
        dependencies[kind].map((dependency_name) => ({
          package_name: packageName,
          kind,
          dependency_name,
        })),
      ),
    ),
  ).catch((ex) => {
    log({
      event_type: 'error_writing_package_manifests',
      event_status: 'error',
      message: ex.stack,
    });
  });

  return packages;
}
