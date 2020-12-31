import {
  GitHubClient,
  getAllTags,
  getRepositoryViewerPermissions,
  getBranch,
  getViewer,
} from '../services/github';
import {getHeadSha} from '../services/git';

import {PublishConfig} from '../types';
import {NewVersionToBePublished} from '../utils/getPackageStatuses';
import {changesToMarkdown} from '@rollingversions/change-set';

export async function checkGitHubReleaseStatus(
  {
    owner,
    name,
    dirname,
    deployBranch,
  }: Pick<PublishConfig, 'owner' | 'name' | 'dirname' | 'deployBranch'>,
  client: GitHubClient,
): Promise<{ok: true; tags: string[]} | {ok: false; reason: string}> {
  const [viewer, permission, branch, allTags] = await Promise.all([
    getViewer(client),
    getRepositoryViewerPermissions(client, {
      owner,
      name,
    }),
    getBranch(client, {owner, name}, deployBranch),
    getAllTags(client, {owner, name}),
  ]);
  if (
    viewer?.login !== 'github-actions[bot]' &&
    (!permission || !['ADMIN', 'MAINTAIN', 'WRITE'].includes(permission))
  ) {
    return {
      ok: false,
      reason: `This GitHub token does not have permisison to publish tags/releases to GitHub. It has viewerPermission ${permission} but needs one of ADMIN, MAINTAIN or WRITE`,
    };
  }
  if (!branch) {
    return {
      ok: false,
      reason: deployBranch
        ? `Could not find the branch "${deployBranch}" in the repository "${owner}/${name}".`
        : `Could not find the default branch in the repository "${owner}/${name}".`,
    };
  }
  if (!branch.headSha) {
    return {
      ok: false,
      reason: `Could not find a commit for the "${branch.name}" in the repository "${owner}/${name}".`,
    };
  }
  const headSha = await getHeadSha(dirname);
  if (headSha !== branch.headSha) {
    return {
      ok: false,
      reason: `This build is not running against the latest commit in ${branch.name}. To avoid awkward race conditions we'll skip publishing here and leave publishing to the other commit.`,
    };
  }

  return {ok: true, tags: (allTags || []).map((t) => t.name)};
}

export async function createGitHubRelease(
  {owner, name: repo, dirname, dryRun, canary, logger}: PublishConfig,
  client: GitHubClient,
  pkg: NewVersionToBePublished,
  tagName: string,
) {
  logger.onPublishGitHubRelease?.({pkg, tagName, dryRun, canary});
  const headSha = await getHeadSha(dirname);
  if (dryRun) {
    logger.onPublishedGitHubRelease?.({pkg, tagName, dryRun});
  } else if (canary === null) {
    const response = (
      await client.rest.repos.createRelease({
        draft: false,
        prerelease: false,
        owner,
        repo,

        body: changesToMarkdown(pkg.changeSet, {
          headingLevel: 2,
          renderContext: ({pr}) => ` (#${pr})`,
        }),
        name: tagName,
        tag_name: tagName,
        target_commitish: headSha,
      })
    ).data;
    logger.onPublishedGitHubRelease?.({pkg, tagName, dryRun, response});
  }
}
