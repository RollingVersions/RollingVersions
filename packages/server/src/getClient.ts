import {Application} from 'probot';
import {Repository} from '@changelogversion/utils/lib/types';
import {GitHubClient} from '@changelogversion/utils/lib/GitHub';

export function getClientForContext(context: {
  github: {request: (v: any) => Promise<any>};
}) {
  return new GitHubClient({request: context.github.request});
}
export async function getClientForRepo(
  app: Application,
  {owner, name}: Repository,
) {
  const installation = await (await app.auth()).apps.getRepoInstallation({
    owner,
    repo: name,
  });
  if (installation.status !== 200) {
    throw new Error(
      `Changelog Version does not seem to be installed for ${owner}`,
    );
  }
  const installationID = installation.data.id;
  const github = await app.auth(installationID);
  return new GitHubClient({request: github.request as any});
}
