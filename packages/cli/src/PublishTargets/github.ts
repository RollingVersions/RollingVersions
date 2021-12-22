import {changesToMarkdown} from '@rollingversions/change-set';
import {printTag} from '@rollingversions/tag-format';

import {getHeadSha} from '../services/git';
import type {GitHubClient} from '../services/github';
import {getRepositoryViewerPermissions, getViewer} from '../services/github';
import {NewVersionToBePublished} from '../types/PackageStatus';
import type PrePublishResult from '../types/PrePublishResult';
import {PublishConfig} from '../types/publish';

export async function checkGitHubReleaseStatus(
  {
    owner,
    name,
    deployBranch,
    allowNonLatestCommit,
    allowAnyBranch,
  }: Pick<
    PublishConfig,
    | 'owner'
    | 'name'
    | 'deployBranch'
    | 'allowNonLatestCommit'
    | 'allowAnyBranch'
  >,
  branches: {
    headSha: string;
    defaultBranch: {headSha: string | null; name: string};
    deployBranch: {headSha: string | null; name: string};
  },
  client: GitHubClient,
): Promise<{ok: true} | {ok: false; reason: string}> {
  const expectedBranchName = deployBranch ?? branches.defaultBranch.name;
  const [viewer, permission] = await Promise.all([
    getViewer(client),
    getRepositoryViewerPermissions(client, {
      owner,
      name,
    }),
  ]);
  if (
    viewer.login !== 'github-actions[bot]' &&
    (!permission || !['ADMIN', 'MAINTAIN', 'WRITE'].includes(permission))
  ) {
    return {
      ok: false,
      reason: `This GitHub token does not have permission to publish tags/releases to GitHub. It has viewerPermission ${permission} but needs one of ADMIN, MAINTAIN or WRITE`,
    };
  }
  if (!allowAnyBranch) {
    if (expectedBranchName !== branches.deployBranch.name) {
      return {
        ok: false,
        reason: `This build is running on branch "${branches.deployBranch.name}" but the deployment branch is "${expectedBranchName}". You can specify a different deployment branch by adding --deploy-branch "${branches.deployBranch.name}" when calling the Rolling Versions CLI, or you can disable this check entirely by passing --allow-any-branch.`,
      };
    }
  }
  if (!allowNonLatestCommit) {
    if (branches.headSha !== branches.deployBranch.headSha) {
      return {
        ok: false,
        reason: `This build is not running against commit "${branches.headSha}" but the latest commit in "${branches.deployBranch.name}" is "${branches.deployBranch.headSha}". To avoid awkward race conditions we'll skip publishing here and leave publishing to the newer commit. You can disable this warning and publish anyway by passing the "--allow-non-latest-commit" flag when calling the Rolling Versions CLI.`,
      };
    }
  }

  return {ok: true};
}

export function checkGitHubTagAvailable(
  {canary}: PublishConfig,
  pkg: NewVersionToBePublished,
  allTagNames: Set<string>,
): PrePublishResult {
  if (canary === null) {
    const tagName = printTag(pkg.newVersion, {
      packageName: pkg.packageName,
      oldTagName: pkg.currentTagName,
      tagFormat: pkg.manifest.tagFormat,
      versionSchema: pkg.manifest.versionSchema,
    });
    if (allTagNames.has(tagName)) {
      return {ok: false, reason: `The tag name ${tagName} already exists.`};
    }
  }
  return {ok: true};
}

export async function createGitHubRelease(
  {owner, name: repo, dirname, dryRun, canary, logger}: PublishConfig,
  client: GitHubClient,
  pkg: NewVersionToBePublished,
) {
  const headSha = await getHeadSha(dirname);
  if (canary) {
    logger.onCanaryGitHubRelease?.({pkg, dryRun});
  } else {
    const tagName = printTag(pkg.newVersion, {
      packageName: pkg.packageName,
      oldTagName: pkg.currentTagName,
      tagFormat: pkg.manifest.tagFormat,
      versionSchema: pkg.manifest.versionSchema,
    });
    logger.onPublishGitHubRelease?.({pkg, tagName, dryRun});
    let response;
    if (!dryRun) {
      response = (
        await client.rest.repos.createRelease({
          draft: false,
          prerelease: false,
          owner,
          repo,

          body:
            (pkg.releaseDescription?.trim()
              ? `${pkg.releaseDescription.trim()}\n\n`
              : ``) +
            changesToMarkdown(pkg.changeSet, {
              headingLevel: 2,
              renderContext: ({pr}) => ` (#${pr})`,
              changeTypes: pkg.manifest.changeTypes,
            }),
          name: tagName,
          tag_name: tagName,
          target_commitish: headSha,
        })
      ).data;
    }
    logger.onPublishedGitHubRelease?.({pkg, tagName, dryRun, response});
  }
}
