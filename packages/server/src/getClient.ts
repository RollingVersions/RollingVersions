import {Application} from 'probot';

export default async function getClient(
  app: Application,
  {owner, repo}: {owner: string; repo: string},
) {
  const installation = await (await app.auth()).apps.getRepoInstallation({
    owner,
    repo,
  });
  if (installation.status !== 200) {
    throw new Error(
      `Changelog Version does not seem to be installed for ${owner}`,
    );
  }
  const installationID = installation.data.id;
  const github = await app.auth(installationID);
  return github;
}
