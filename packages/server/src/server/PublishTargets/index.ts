import * as npm from './npm';
import PublishTarget from 'rollingversions/lib/types/PublishTarget';
import {PackageManifest} from 'rollingversions/lib/types';

const targets = {
  [PublishTarget.npm]: npm,
};

export async function getRegistryVersion(pkg: PackageManifest) {
  if (pkg.notToBePublished) return null;
  return await targets[pkg.publishTarget].getRegistryVersion(pkg);
}
