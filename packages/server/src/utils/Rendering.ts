import {URL} from 'url';
import {
  PackageManifestWithVersion,
  ChangeSet,
  PullRequest,
} from 'rollingversions/lib/types';
import {isEmptyChangeSet} from 'rollingversions/lib/types/PullRequestState';
import {writeState} from 'rollingversions/lib/utils/CommentState';
import changesToMarkdown from 'rollingversions/lib/utils/changesToMarkdown';
import {
  getCurrentVerion,
  getNewVersion,
} from 'rollingversions/lib/utils/Versioning';
import {PullRequestPackage} from '../types';

// N.B. this comment guid must be kept in sync with the CLI for now
export const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;
const COMMENT_PREFIX = `<!-- This comment is maintained by Rolling Versions. Do not edit it manually! -->\n<!-- ${COMMENT_GUID} -->\n\n`;

export function getVersionShift(
  currentVersion: PackageManifestWithVersion[],
  changes: ChangeSet,
) {
  // if we want to support not knowing the previous version:
  // if (currentVersion === undefined) {
  //   const bump = getVersionBump(changes);
  //   switch (bump) {
  //     case 'major':
  //       return '(↑.-.-)';
  //     case 'minor':
  //       return '(-.↑.-)';
  //     case 'patch':
  //       return '(-.-.↑)';
  //     default:
  //       return 'no new release';
  //   }
  // }
  return `(${getCurrentVerion(currentVersion) || 'unreleased'} → ${
    getNewVersion(currentVersion, changes) || 'no new release'
  })`;
}

export function getUrlForChangeLog(
  pr: Pick<PullRequest, 'repo' | 'number'>,
  rollingVersionsUrl: URL,
) {
  const url = new URL(
    `/${pr.repo.owner}/${pr.repo.name}/pull/${pr.number}`,
    rollingVersionsUrl,
  );
  return url;
}

export function getShortDescription({
  headSha,
  submittedAtCommitSha,
  packagesToRelease,
}: {
  headSha: string;
  submittedAtCommitSha: string | null;
  packagesToRelease: string[];
}) {
  if (submittedAtCommitSha === headSha) {
    if (packagesToRelease.length === 0) {
      return 'no changes to release';
    }
    if (packagesToRelease.length === 1) {
      return `releasing ${packagesToRelease[0]}`;
    }
    return 'releasing multiple packages';
  }
  if (!submittedAtCommitSha) {
    return 'please add a changelog';
  }
  return 'please update the changelog';
}

export function renderInitialCommentWithoutState(
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  return `There is no change log for this pull request yet.\n\n[Create a changelog](${url.href})`;
}

export function renderCommentWithoutState(
  pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  submittedAtCommitSha: string | null,
  packagesMap: Map<string, PullRequestPackage>,
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  const outdated =
    !pullRequest.headSha || pullRequest.headSha === submittedAtCommitSha
      ? ``
      : `\n\n> **Change log has not been updated since latest commit** [Update Changelog](${url.href})`;

  const packages = [...packagesMap].sort(([a], [b]) => (a < b ? -1 : 1));
  if (packages.length === 1) {
    const [packageName, {changeSet, manifests}] = packages[0];
    if (isEmptyChangeSet(changeSet)) {
      return `This PR will **not** result in a new version of ${packageName} as there are no user facing changes.\n\n[Add changes to trigger a release](${url.href})${outdated}`;
    }
    return `### Change Log for ${packageName} ${getVersionShift(
      manifests,
      changeSet,
    )}\n\n${changesToMarkdown(changeSet, 4)}\n\n[Edit changelog](${
      url.href
    })${outdated}`;
  }

  const packagesWithChanges = packages.filter(([, {changeSet}]) => {
    return !isEmptyChangeSet(changeSet);
  });
  const packagesWithoutChanges = packages.filter(([, {changeSet}]) => {
    return isEmptyChangeSet(changeSet);
  });
  if (!packagesWithChanges.length) {
    return `This PR will **not** result in a new version of the following packages as there are no user facing changes:\n\n${packages
      .map(([packageName]) => `- ${packageName}`)
      .join('\n')}\n\n[Add changes to trigger a release](${
      url.href
    })${outdated}`;
  }
  return `${packagesWithChanges
    .map(([packageName, {changeSet, manifests}]) => {
      return `### ${packageName} ${getVersionShift(
        manifests,
        changeSet,
      )}\n\n${changesToMarkdown(changeSet, 4)}`;
    })
    .join('\n\n')}${
    packagesWithoutChanges.length
      ? `\n\n### Packages With No Changes\n\nThe following packages have no user facing changes, so won't be released:\n\n${packagesWithoutChanges
          .map(([packageName]) => `- ${packageName}`)
          .join('\n')}`
      : ``
  }\n\n[Edit changelogs](${url.href})${outdated}`;
}

export function renderInitialComment(
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  rollingVersionsUrl: URL,
) {
  return `${COMMENT_PREFIX}${renderInitialCommentWithoutState(
    pullRequest,
    rollingVersionsUrl,
  )}`;
}
export function renderComment(
  pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  submittedAtCommitSha: string | null,
  packages: Map<string, PullRequestPackage>,
  rollingVersionsUrl: URL,
) {
  return writeState(
    `${COMMENT_PREFIX}${renderCommentWithoutState(
      pullRequest,
      submittedAtCommitSha,
      packages,
      rollingVersionsUrl,
    )}`,
    {
      submittedAtCommitSha,
      packages: new Map(
        [...packages].map(([packageName, {changeSet}]) => [
          packageName,
          changeSet,
        ]),
      ),
    },
  );
}
