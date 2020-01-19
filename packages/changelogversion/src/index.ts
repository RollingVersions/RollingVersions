import DataLoader from 'dataloader';
import {graphql} from '@octokit/graphql';
import {
  listPackages,
  getCommits,
  getChangeLogs,
} from 'changelogversion-utils/lib/LocalRepo';
import {getCurrentVerion} from 'changelogversion-utils/lib/Versioning';

interface Config {
  dirname: string;
  owner: string;
  name: string;
  accessToken: string;
}

async function run({dirname, owner, name, accessToken}: Config) {
  const commitsLoader = new DataLoader(
    async (since: readonly (string | undefined)[]) => {
      return await Promise.all(since.map((t) => getCommits(dirname, t)));
    },
  );
  const changeLogsLoader = new DataLoader(
    async (commits: readonly string[]) => {
      return await getChangeLogs(
        graphql.defaults({
          headers: {
            authorization: `token ${accessToken}`,
          },
        }),
        owner,
        name,
        commits,
      );
    },
  );

  const packages = await listPackages(dirname);
  await Promise.all(
    Object.entries(packages).map(async ([packageName, infos]) => {
      if (!infos) return;
      const currentVersion = getCurrentVerion(infos);
      const currentTag = currentVersion
        ? infos.find((info) => info.versionTag?.version === currentVersion)
            ?.versionTag
        : null;
      if (currentVersion && !currentTag) {
        // TODO: proper error reporting
        console.error(
          `You must add a git tag for ${packageName}@${currentVersion}`,
        );
        process.exit(1);
      }
      const commits = await commitsLoader.load(
        currentTag ? currentTag.commitSha : undefined,
      );
      const changeLogs = await changeLogsLoader.loadMany(commits);
      for (const cl of changeLogs) {
        if (cl instanceof Error) {
          throw cl;
        }
        console.info(cl);
      }
      // TODO: pretty print output and publish packages
    }),
  );
}

run({
  // TODO: create actual CLI that parses args and env and passes in appropriate values for these
  dirname: process.cwd(),
  owner: 'ForbesLindesay',
  name: 'changelogversion',
  accessToken: process.argv[2],
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
