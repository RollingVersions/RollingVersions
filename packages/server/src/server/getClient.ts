import {GitHubClient, auth} from '@changelogversion/utils/lib/GitHub';
import {APP_ID, PRIVATE_KEY} from './environment';
import isObject from '../utils/isObject';
import {Repository} from '@changelogversion/utils/lib/types';

export function getClientForEvent(event: {
  readonly id: string;
  readonly name: string;
  readonly payload: unknown;
}) {
  if (
    isObject(event.payload) &&
    isObject(event.payload.installation) &&
    typeof event.payload.installation.id === 'number' &&
    (event.name !== 'installation' || event.payload.action !== 'deleted')
  ) {
    return getClient(event.payload.installation.id);
  } else {
    return getClient();
  }
}
export default function getClient(installationId?: number) {
  return new GitHubClient({
    auth: auth.createAppAuth({
      id: APP_ID,
      privateKey: PRIVATE_KEY,
      installationId,
    }),
  });
}

export async function getClientForRepo({owner, name}: Repository) {
  const installation = await getClient().rest.apps.getRepoInstallation({
    owner,
    repo: name,
  });
  if (installation.status !== 200) {
    throw new Error(
      `Changelog Version does not seem to be installed for ${owner}`,
    );
  }
  const installationID = installation.data.id;
  return getClient(installationID);
}
