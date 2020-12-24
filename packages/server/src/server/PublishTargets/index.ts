import * as npm from './npm';
import PublishTarget from 'rollingversions/lib/types/PublishTarget';
import {PackageManifest} from 'rollingversions/lib/types';
import ServerContext from '../ServerContext';

const targets = {
  [PublishTarget.npm]: npm,
  [PublishTarget.custom_script]: {getRegistryVersion: async () => null},
};

export async function getRegistryVersion(
  ctx: ServerContext,
  pkg: PackageManifest,
) {
  if (pkg.notToBePublished) return null;
  return await targets[pkg.targetConfig.type].getRegistryVersion(ctx, pkg);
}
