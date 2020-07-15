import {getNpmVersion} from '../services/npm';
import PackageManifest from 'rollingversions/lib/types/PackageManifest';

export async function getRegistryVersion(pkg: PackageManifest) {
  if (pkg.notToBePublished) return null;
  return await getNpmVersion(pkg.packageName);
}
