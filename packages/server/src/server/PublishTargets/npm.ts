import PackageManifest from 'rollingversions/lib/types/PackageManifest';
import {getNpmVersion} from '../services/npm';
import ServerContext from '../ServerContext';

export async function getRegistryVersion(
  ctx: ServerContext,
  pkg: PackageManifest,
) {
  if (pkg.notToBePublished) return null;
  return await getNpmVersion(ctx, pkg.packageName);
}
