import {URL} from 'url';
import Octokit from '@octokit/rest';
import {
  COMMENT_GUID,
  PullRequst,
  renderComment,
  getUrlForChangeLog,
  getShortDescription,
} from './Rendering';
import {readState} from './CommentState';
import PullChangeLog from './PullChangeLog';
import {PackageInfo, Platform, PackageInfos} from './Platforms';
import isObject from './utils/isObject';
import addVersions from './utils/addVersions';
import VersionTag from './VersionTag';

import Client from '@github-graph/api';
import * as gh from './github-graph';

async function* paginate<TPage, TEntry>(
  getPage: (token?: string) => Promise<TPage>,
  getEntries: (page: TPage) => TEntry[],
  getNextPageToken: (page: TPage) => string | undefined,
) {
  let page;
  let nextPageToken;
  while (nextPageToken) {
    page = await getPage(nextPageToken);
    nextPageToken = getNextPageToken(page);
    for (const entry of getEntries(page)) {
      yield entry;
    }
  }
}
export async function getAllTags(
  client: Client,
  pr: Pick<PullRequst, 'owner' | 'repo'>,
) {
  const results: Pick<VersionTag, 'commitSha' | 'name'>[] = [];
  for await (const tag of paginate(
    (after) => gh.getTags(client, {owner: pr.owner, name: pr.repo, after}),
    (page) => page?.repository?.refs?.nodes || [],
    (page) =>
      (page?.repository?.refs?.pageInfo?.hasNextPage &&
        page?.repository?.refs?.pageInfo?.endCursor) ||
      undefined,
  )) {
    if (tag) {
      results.push({commitSha: tag.target.oid, name: tag.name});
    }
  }
  return results;
}

interface Entry {
  name: string;
  object:
    | null
    | {__typename: 'Tree'; oid: string; entries?: Entry[] | null}
    | {__typename: 'Blob'; oid: string}
    | {__typename: 'Tag'}
    | {__typename: 'Commit'};
}
async function listRawPackages(
  client: Client,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'number'>,
) {
  const commit = (
    await gh.getPullRequestFileNames(client, {
      owner: pr.owner,
      name: pr.repo,
      number: pr.number,
    })
  ).repository?.pullRequest?.headRef?.target;
  if (!commit || commit.__typename !== 'Commit') {
    throw new Error(
      `Expected a Commit but got ${commit?.__typename || 'undefined'}`,
    );
  }

  const packages = new Map<
    string,
    Array<Omit<PackageInfo, 'versionTag' | 'registryVersion'>>
  >();
  const queue: Promise<unknown>[] = [];
  function processEntry(entry: Entry, path: string[]) {
    switch (entry.object?.__typename) {
      case 'Blob':
        if (entry.name === 'package.json') {
          queue.push(
            gh
              .getFile(client, {
                owner: pr.owner,
                name: pr.repo,
                oid: entry.object.oid,
              })
              .then((file) => {
                if (file.repository?.object?.__typename === 'Blob') {
                  const content = file.repository.object.text;
                  let result: unknown;
                  try {
                    result = content && JSON.parse(content);
                  } catch (ex) {
                    // ignore
                  }
                  if (isObject(result) && typeof result.name === 'string') {
                    packages.set(result.name, packages.get(result.name) || []);
                    packages.get(result.name)!.push({
                      path: [...path, entry.name].join('/'),
                      platform: Platform.npm,
                      publishConfigAccess:
                        result.name[0] === '@'
                          ? isObject(result.publishConfig) &&
                            result.publishConfig.access === 'public'
                            ? 'public'
                            : 'restricted'
                          : 'public',
                      packageName: result.name,
                      notToBePublished: result.private === true,
                    });
                  }
                }
              }),
          );
        }
        break;
      case 'Tree':
        entry.object.entries?.forEach((e) =>
          processEntry(e, [...path, entry.name]),
        );
        break;
    }
  }
  commit.tree.entries?.forEach((entry) => processEntry(entry, []));
  await Promise.all(queue);
  return packages;
}
export async function listPackages(
  client: Client,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'number'>,
): Promise<PackageInfos> {
  const [packages, allTags] = await Promise.all([
    listRawPackages(client, pr),
    getAllTags(client, pr),
  ]);

  return await addVersions(packages, allTags);
}

export async function readComment(
  client: Client,
  pr: Pick<PullRequst, 'owner' | 'repo' | 'number'>,
): Promise<{
  existingComment: number | undefined;
  state: PullChangeLog;
}> {
  for await (const comment of paginate(
    (after) =>
      gh.getPullRequestComments(client, {
        owner: pr.owner,
        name: pr.repo,
        number: pr.number,
        after,
      }),
    (page) => page?.repository?.pullRequest?.comments?.nodes || [],
    (page): string | undefined =>
      (page?.repository?.pullRequest?.comments?.pageInfo?.hasNextPage &&
        page?.repository?.pullRequest?.comments?.pageInfo?.endCursor) ||
      undefined,
  )) {
    if (comment?.databaseId && comment?.body.includes(COMMENT_GUID)) {
      return {
        existingComment: comment.databaseId,
        state: readState(comment.body) || {
          submittedAtCommitSha: null,
          packages: [],
        },
      };
    }
  }
  return {
    existingComment: undefined,
    state: {
      submittedAtCommitSha: null,
      packages: [],
    },
  };
}

export async function writeComment(
  github: Pick<Octokit, 'issues'>,
  existingComment: number | undefined,
  pr: PullRequst,
  changeLog: PullChangeLog | undefined,
  changeLogVersionURL: URL,
) {
  const body = renderComment(pr, changeLog, changeLogVersionURL);
  if (existingComment) {
    await github.issues.updateComment({
      owner: pr.owner,
      repo: pr.repo,
      body,
      comment_id: existingComment,
    });
  } else {
    await github.issues.createComment({
      issue_number: pr.number,
      owner: pr.owner,
      repo: pr.repo,
      body,
    });
  }
}

export async function updateStatus(
  github: Pick<Octokit, 'repos'>,
  pr: PullRequst,
  changeLog: PullChangeLog | undefined,
  changeLogVersionURL: URL,
) {
  const url = getUrlForChangeLog(pr, changeLogVersionURL);
  await github.repos.createStatus({
    owner: pr.owner,
    repo: pr.repo,
    sha: pr.headSha,
    state:
      changeLog && pr.headSha === changeLog.submittedAtCommitSha
        ? 'success'
        : 'pending',
    target_url: url.href,
    description: getShortDescription(pr, changeLog),
    context: 'Changelog',
  });
}
