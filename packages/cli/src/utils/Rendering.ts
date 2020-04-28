import {URL} from 'url';
import {PullRequest, PackageInfo} from '../types';
import PullRequestState, {
  ChangeTypes,
  ChangeSet,
  isEmptyChangeSet,
} from '../types/PullRequestState';
import {writeState} from './CommentState';
import {getNewVersion, getCurrentVerion} from './Versioning';

export const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;
const COMMENT_PREFIX = `<!-- This comment is maintained by Rolling Versions. Do not edit it manually! -->\n<!-- ${COMMENT_GUID} -->\n\n`;

export function changesToMarkdown(
  changes: ChangeSet<{readonly pr?: number}>,
  headingLevel: number,
) {
  const headingPrefix = '#'.repeat(headingLevel);
  return ChangeTypes.filter((changeType) => changes[changeType].length)
    .map(
      (changeType) =>
        `${headingPrefix} ${
          {
            breaking: 'Breaking Changes',
            feat: 'New Features',
            refactor: 'Refactorings',
            perf: 'Performance Improvements',
            fix: 'Bug Fixes',
          }[changeType]
        }\n\n${changes[changeType]
          .map(
            (c) =>
              `- ${c.title}${c.pr ? ` (#${c.pr})` : ``}${
                c.body ? `\n\n${c.body.replace(/^/gm, '  ')}` : ``
              }`,
          )
          .join('\n\n')}`,
    )
    .join('\n\n');
}

export function getVersionShift(
  currentVersion: PackageInfo[],
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
  return `(${getCurrentVerion(currentVersion) ||
    'unreleased'} → ${getNewVersion(currentVersion, changes) ||
    'no new release'})`;
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

export function getShortDescription(changeLog: PullRequestState | undefined) {
  if (
    changeLog &&
    changeLog.submittedAtCommitSha === changeLog.packageInfoFetchedAt
  ) {
    const packagesToRelease = [...changeLog.packages.entries()].filter(
      ([, {changes}]) => !isEmptyChangeSet(changes),
    );
    if (packagesToRelease.length === 0) {
      return 'no changes to release';
    }
    if (packagesToRelease.length === 1) {
      return `releasing ${packagesToRelease[0][0]}`;
    }
    return 'releasing multiple packages';
  }
  return changeLog && changeLog.submittedAtCommitSha
    ? 'please update the changelog'
    : 'please add a changelog';
}

export function renderInitialCommentWithoutState(
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  return `There is no change log for this pull request yet.\n\n[Create a changelog](${url.href})`;
}

export function renderCommentWithoutState(
  pullRequest: Omit<PullRequest, 'headSha'>,
  changeLog: PullRequestState | undefined,
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  if (!changeLog || !changeLog.submittedAtCommitSha) {
    return renderInitialCommentWithoutState(pullRequest, rollingVersionsUrl);
  }
  const outdated =
    changeLog.packageInfoFetchedAt === changeLog.submittedAtCommitSha
      ? ``
      : `\n\n> **Change log has not been updated since latest commit** [Update Changelog](${url.href})`;

  const packages = [...changeLog.packages].sort(([a], [b]) => (a < b ? -1 : 1));
  if (packages.length === 1) {
    const [packageName, pkg] = packages[0];
    if (!pkg || isEmptyChangeSet(pkg.changes)) {
      return `This PR will **not** result in a new version of ${packageName} as there are no user facing changes.\n\n[Add changes to trigger a release](${url.href})${outdated}`;
    }
    return `### Change Log for ${packageName} ${getVersionShift(
      pkg.info,
      pkg.changes,
    )}\n\n${changesToMarkdown(pkg.changes, 4)}\n\n[Edit changelog](${
      url.href
    })${outdated}`;
  }

  const packagesWithChanges = packages.filter(([, pkg]) => {
    return !isEmptyChangeSet(pkg.changes);
  });
  const packagesWithoutChanges = packages.filter(([, pkg]) => {
    return isEmptyChangeSet(pkg.changes);
  });
  if (!packagesWithChanges.length) {
    return `This PR will **not** result in a new version of the following packages as there are no user facing changes:\n\n${packages
      .map(([packageName]) => `- ${packageName}`)
      .join('\n')}\n\n[Add changes to trigger a release](${
      url.href
    })${outdated}`;
  }
  return `${packagesWithChanges
    .map(
      ([packageName, pkg]) =>
        `### ${packageName} ${getVersionShift(
          pkg.info,
          pkg.changes,
        )}\n\n${changesToMarkdown(pkg.changes, 4)}`,
    )
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
  pullRequest: Omit<PullRequest, 'headSha'>,
  changeLog: PullRequestState | undefined,
  rollingVersionsUrl: URL,
) {
  return writeState(
    `${COMMENT_PREFIX}${renderCommentWithoutState(
      pullRequest,
      changeLog,
      rollingVersionsUrl,
    )}`,
    changeLog,
  );
}

export function renderReleaseNotes(changes: ChangeSet<{readonly pr?: number}>) {
  return changesToMarkdown(changes, 3);
}
