import {URL} from 'url';
import DataLoader from 'dataloader';
import {
  COMMENT_GUID,
  getUrlForChangeLog,
  getShortDescription,
} from './Rendering';
import {readState} from './CommentState';
import PullChangeLog from './PullChangeLog';
import {PackageInfo, Platform, PackageInfos} from './Platforms';
import isObject from './utils/isObject';
import addVersions from './utils/addVersions';
import VersionTag from './VersionTag';

import GitHubClient, {auth} from '@github-graph/api';
import * as gh from './github-graph';
import paginate from './utils/paginate';
import {Repository, PullRequest} from './types';

export {GitHubClient, auth};

export async function getPullRequestHeadSha(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
) {
  return (
    await gh.getPullRequestHeadSha(client, {
      owner: pr.repo.owner,
      name: pr.repo.name,
      number: pr.number,
    })
  ).repository?.pullRequest?.headRef?.target.oid;
}
export async function getRepositoryViewerPermissions(
  client: GitHubClient,
  repo: Repository,
) {
  return (
    (await gh.getRepositoryViewerPermissions(client, repo)).repository
      ?.viewerPermission || null
  );
}

export async function getBranch(
  client: GitHubClient,
  repo: Repository,
  deployBranch?: string | null,
) {
  const data = await (deployBranch
    ? gh.getBranch(client, {
        ...repo,
        qualifiedName: `refs/heads/${deployBranch}`,
      })
    : gh.getDefaultBranch(client, repo));

  if (data.repository?.branch) {
    return {
      name: data.repository.branch.name,
      headSha:
        data.repository.branch.target.__typename === 'Commit'
          ? `${data.repository.branch.target.oid}`
          : null,
    };
  }

  return null;
}

export async function getAllTags(client: GitHubClient, repo: Repository) {
  const results: Pick<VersionTag, 'commitSha' | 'name'>[] = [];
  for await (const tag of paginate(
    (after) => gh.getTags(client, {...repo, after}),
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
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
) {
  const commit = (
    await gh.getPullRequestFileNames(client, {
      ...pr.repo,
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
                ...pr.repo,
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
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
): Promise<PackageInfos> {
  const [packages, allTags] = await Promise.all([
    listRawPackages(client, pr),
    getAllTags(client, pr.repo),
  ]);

  return await addVersions(packages, allTags);
}

export async function readComment(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
): Promise<{
  existingComment: number | undefined;
  state: PullChangeLog;
}> {
  for await (const comment of paginate(
    (after) =>
      gh.getPullRequestComments(client, {
        ...pr.repo,
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
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
  body: string,
  existingComment: number | undefined,
) {
  if (existingComment) {
    return (
      await client.rest.issues.updateComment({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        body,
        comment_id: existingComment,
      })
    ).data.id;
  } else {
    return (
      await client.rest.issues.createComment({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        issue_number: pr.number,
        body,
      })
    ).data.id;
  }
}

export async function updateStatus(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number' | 'headSha'>,
  changeLog: PullChangeLog | undefined,
  changeLogVersionURL: URL,
) {
  const url = getUrlForChangeLog(pr, changeLogVersionURL);
  await client.rest.repos.createStatus({
    owner: pr.repo.owner,
    repo: pr.repo.name,
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

export function getChangeLogFetcher(client: GitHubClient, repo: Repository) {
  const pullRequestsFromCommit = new DataLoader<string, number[]>(
    async (commitShas) => {
      return await Promise.all(
        commitShas.map(async (sha) => {
          const pulls = await gh.getPullRequestsForCommit(client, {
            ...repo,
            sha,
          });
          return (
            (pulls.repository?.object?.__typename === 'Commit' &&
              pulls.repository.object.associatedPullRequests?.nodes
                ?.map((pr) => pr?.number)
                .filter((num): num is number => typeof num === 'number')) ||
            []
          );
        }),
      );
    },
  );
  const commentFromPullRequest = new DataLoader<
    number,
    PullChangeLog & {pr: number}
  >(async (pullNumbers) => {
    return await Promise.all(
      pullNumbers.map(
        async (n) =>
          await readComment(client, {
            repo,
            number: n,
          }).then((v) => ({...v.state, pr: n})),
      ),
    );
  });
  return async function getChangeLog(commitShas: readonly string[]) {
    const pullRequests = [
      ...new Set(
        (await pullRequestsFromCommit.loadMany(commitShas))
          .map((v) => {
            if (v instanceof Error) {
              throw v;
            }
            return v;
          })
          .reduce((a, b) => {
            a.push(...b);
            return a;
          }, []),
      ),
    ];
    return (await commentFromPullRequest.loadMany(pullRequests)).map((s) => {
      if (s instanceof Error) {
        throw s;
      }
      return s;
    });
  };
}
