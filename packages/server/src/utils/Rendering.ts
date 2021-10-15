import {URL} from 'url';

import type ChangeSet from '@rollingversions/change-set';
import {changesToMarkdown, isEmptyChangeSet} from '@rollingversions/change-set';
import {PackageManifest, PullRequest, VersionTag} from '@rollingversions/types';
import {getNextVersion, printString} from '@rollingversions/version-number';

import type {PullRequestPackage} from '../types';

// N.B. this comment guid must be kept in sync with the CLI for now
export const COMMENT_GUID = `9d24171b-1f63-43f0-9019-c4202b3e8e22`;
const COMMENT_PREFIX = `<!-- This comment is maintained by Rolling Versions. Do not edit it manually! -->\n<!-- ${COMMENT_GUID} -->\n\n`;

export function getVersionShift(
  currentVersion: VersionTag | null,
  changes: ChangeSet,
  manifest: PackageManifest,
) {
  const newVersion = getNextVersion(currentVersion?.version ?? null, changes, {
    changeTypes: manifest.changeTypes,
    versionSchema: manifest.versionSchema,
    baseVersion: manifest.baseVersion,
  });
  return `(${
    currentVersion?.version ? printString(currentVersion.version) : 'unreleased'
  } → ${newVersion ? printString(newVersion) : 'no new release'})`;
}

export function getUrlForChangeLog(pr: PullRequest, rollingVersionsUrl: URL) {
  const url = new URL(
    `/${pr.repo.owner}/${pr.repo.name}/pull/${pr.number}`,
    rollingVersionsUrl,
  );
  return url;
}

export function getShortDescription(packages: Map<string, PullRequestPackage>) {
  const packagesToRelease = [...packages].filter(
    ([, {changeSet}]) => !isEmptyChangeSet(changeSet),
  );
  if (packagesToRelease.length === 0) {
    return 'no changes to release';
  }
  if (packagesToRelease.length === 1) {
    return `releasing ${packagesToRelease[0][0]}`;
  }
  return 'releasing multiple packages';
}

export function renderInitialCommentWithoutState(
  pullRequest: PullRequest,
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  return `There is no change log for this pull request yet.\n\n[Create a changelog](${url.href})`;
}

export function renderCommentWithoutState(
  pullRequest: Omit<PullRequest, 'headSha'> & {headSha: string | null},
  submittedAtCommitSha: string | null,
  packagesMap: Map<string, PullRequestPackage>,
  packageErrors: {filename: string; error: string}[],
  rollingVersionsUrl: URL,
) {
  const url = getUrlForChangeLog(pullRequest, rollingVersionsUrl);
  const warnings =
    (packageErrors.length === 0
      ? ``
      : [
          `\n\n> Errors were encountered while parsing:`,
          ...packageErrors.map((e) => `>  - ${e.filename}`),
        ].join(`\n`)) +
    (pullRequest.headSha === submittedAtCommitSha
      ? ``
      : `\n\n> **Change log has not been updated since latest commit** [Update Changelog](${url.href})`);

  const packages = [...packagesMap].sort(([a], [b]) => (a < b ? -1 : 1));
  if (packages.length === 1) {
    const [packageName, {changeSet, currentVersion, manifest}] = packages[0];
    if (isEmptyChangeSet(changeSet)) {
      return `This PR will **not** result in a new version of ${packageName} as there are no user facing changes.\n\n[Add changes to trigger a release](${url.href})${warnings}`;
    }
    return `### Change Log for ${packageName} ${getVersionShift(
      currentVersion,
      changeSet,
      manifest,
    )}\n\n${changesToMarkdown(changeSet, {
      headingLevel: 4,
      changeTypes: manifest.changeTypes,
    })}\n\n[Edit changelog](${url.href})${warnings}`;
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
    })${warnings}`;
  }
  return `${packagesWithChanges
    .map(([packageName, {changeSet, currentVersion, manifest}]) => {
      return `### ${packageName} ${getVersionShift(
        currentVersion,
        changeSet,
        manifest,
      )}\n\n${changesToMarkdown(changeSet, {
        headingLevel: 4,
        changeTypes: manifest.changeTypes,
      })}`;
    })
    .join('\n\n')}${
    packagesWithoutChanges.length
      ? `\n\n### Packages With No Changes\n\nThe following packages have no user facing changes, so won't be released:\n\n${packagesWithoutChanges
          .map(([packageName]) => `- ${packageName}`)
          .join('\n')}`
      : ``
  }\n\n[Edit changelogs](${url.href})${warnings}`;
}

export function renderInitialComment(
  pullRequest: PullRequest,
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
  manifests: {
    packages: Map<string, PullRequestPackage>;
    packageErrors: {filename: string; error: string}[];
  },
  rollingVersionsUrl: URL,
) {
  return `${COMMENT_PREFIX}${renderCommentWithoutState(
    pullRequest,
    submittedAtCommitSha,
    manifests.packages,
    manifests.packageErrors,
    rollingVersionsUrl,
  )}`;
}
