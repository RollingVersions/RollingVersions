import {getNpmVersion} from '../services/npm';
import PackageManifest from 'rollingversions/lib/types/PackageManifest';
import {Logger} from '../logger';

export async function getRegistryVersion(pkg: PackageManifest, logger: Logger) {
  if (pkg.notToBePublished) return null;
  return await getNpmVersion(pkg.packageName, logger);
}
