import {URL} from 'url';
import GitHubClient, {auth} from '@github-graph/api';

import {Repository, PullRequest} from '../../types';

import paginate from './paginate';
import * as gh from './github-graph';
import isTruthy from '../../ts-utils/isTruthy';

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
export async function getPullRequestStatus(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
) {
  return (
    (
      await gh.getPullRequestStatus(client, {
        owner: pr.repo.owner,
        name: pr.repo.name,
        number: pr.number,
      })
    ).repository?.pullRequest || undefined
  );
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
  const results: {commitSha: string; name: string}[] = [];
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

export async function* getAllFiles(
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

  function* processEntry(
    entry: Entry,
    path: string[],
  ): Generator<
    {
      path: string;
      getContents: () => Promise<string>;
    },
    void,
    void
  > {
    switch (entry.object?.__typename) {
      case 'Blob':
        const oid = entry.object.oid;
        yield {
          path: path.join('/'),
          getContents: async () => {
            const file = await gh.getFile(client, {
              ...pr.repo,
              oid,
            });
            if (!file.repository) {
              throw new Error('Could not find repository');
            }
            if (!file.repository.object) {
              throw new Error('Could not find file');
            }
            if (file.repository.object.__typename !== 'Blob') {
              throw new Error(
                `Expected a Blob but got ${file.repository.object.__typename}`,
              );
            }
            return file.repository.object.text || '';
          },
        };
        break;
      case 'Tree':
        for (const e of entry.object.entries || []) {
          yield* processEntry(e, [...path, e.name]);
        }
        break;
    }
  }
  for (const e of commit.tree.entries || []) {
    yield* processEntry(e, [e.name]);
  }
}

export async function* readComments(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
  {pageSize = 5}: {pageSize?: number} = {},
) {
  for await (const comment of paginate(
    (after) =>
      gh.getPullRequestComments(client, {
        ...pr.repo,
        number: pr.number,
        after,
        first: pageSize,
      }),
    (page) => page?.repository?.pullRequest?.comments?.nodes || [],
    (page): string | undefined =>
      (page?.repository?.pullRequest?.comments?.pageInfo?.hasNextPage &&
        page?.repository?.pullRequest?.comments?.pageInfo?.endCursor) ||
      undefined,
  )) {
    if (comment?.databaseId) {
      yield {
        commentID: comment.databaseId,
        body: comment.body,
      };
    }
  }
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

export async function deleteComment(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number'>,
  existingComment: number,
) {
  await client.rest.issues.deleteComment({
    owner: pr.repo.owner,
    repo: pr.repo.name,
    comment_id: existingComment,
  });
}

export async function updateStatus(
  client: GitHubClient,
  pr: Pick<PullRequest, 'repo' | 'number' | 'headSha'>,
  status: {
    state: 'success' | 'pending' | 'error' | 'failure';
    url: URL;
    description: string;
  },
) {
  await client.rest.repos.createStatus({
    owner: pr.repo.owner,
    repo: pr.repo.name,
    sha: pr.headSha,
    state: status.state,
    target_url: status.url.href,
    description: status.description,
    context: 'RollingVersions',
  });
}

export async function getPullRequestsForCommit(
  client: GitHubClient,
  repo: Repository,
  sha: string,
) {
  const pulls = await gh.getPullRequestsForCommit(client, {
    ...repo,
    sha,
  });
  return (
    (pulls.repository?.object?.__typename === 'Commit' &&
      pulls.repository.object.associatedPullRequests?.nodes
        ?.map((pr) => pr?.number)
        .filter(isTruthy)) ||
    []
  );
}

export async function* getAllCommits(
  client: GitHubClient,
  repo: Repository,
  {pageSize = 20}: {pageSize?: number} = {},
) {
  for await (const commit of paginate(
    (after) =>
      gh.getAllCommits(client, {
        ...repo,
        after,
        first: pageSize,
      }),
    (page) =>
      (page?.repository?.defaultBranchRef?.target?.__typename === 'Commit' &&
        page.repository.defaultBranchRef.target.history.nodes) ||
      [],
    (page): string | undefined =>
      (page?.repository?.defaultBranchRef?.target?.__typename === 'Commit' &&
        page.repository.defaultBranchRef.target.history.pageInfo.hasNextPage &&
        page.repository.defaultBranchRef.target.history.pageInfo.endCursor) ||
      undefined,
  )) {
    if (commit) {
      yield commit;
    }
  }
}
