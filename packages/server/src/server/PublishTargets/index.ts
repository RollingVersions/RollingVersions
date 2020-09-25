import * as npm from './npm';
import PublishTarget from 'rollingversions/lib/types/PublishTarget';
import {PackageManifest} from 'rollingversions/lib/types';
import {Logger} from '../logger';

const targets = {
  [PublishTarget.npm]: npm,
  [PublishTarget.custom_script]: {getRegistryVersion: async () => null},
};

export async function getRegistryVersion(pkg: PackageManifest, logger: Logger) {
  if (pkg.notToBePublished) return null;
  return await targets[pkg.targetConfig.type].getRegistryVersion(pkg, logger);
}
