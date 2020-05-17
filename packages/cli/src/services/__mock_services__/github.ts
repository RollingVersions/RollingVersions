import * as real from '../github';
import {byRepo, byPullRequest} from './fixtures';
import {RepositoryPermission} from '../github/github-graph';

export const getViewer: typeof real.getViewer = async (_client) => {
  return {
    __typename: 'User',
    login: 'ForbesLindesay',
    email: 'forbes@lindesay.co.uk',
  };
};

export const getPullRequestHeadSha: typeof real.getPullRequestHeadSha = async (
  _client,
  pr,
) => {
  return byPullRequest(pr).headSha || undefined;
};

export const getPullRequestStatus: typeof real.getPullRequestStatus = async (
  _client,
  pr,
) => {
  return {
    closed: byPullRequest(pr).closed,
    merged: byPullRequest(pr).merged,
  };
};

export const getRepositoryViewerPermissions: typeof real.getRepositoryViewerPermissions = async () => {
  return RepositoryPermission.ADMIN;
};

export const getBranch: typeof real.getBranch = async (_client, repo) => {
  const commits = byRepo(repo).commits;
  return {
    name: 'master',
    headSha: commits[0].sha,
  };
};

export const getAllTags: typeof real.getAllTags = async (_client, repo) => {
  return byRepo(repo)
    .commits.map((c) =>
      c.tags.map((name) => ({
        graphql_id: `TAG_${repo.owner}_${repo.name}_${name}`,
        name,
        commitSha: c.sha,
      })),
    )
    .reduce((a, b) => [...a, ...b], []);
};

export const getAllFiles: typeof real.getAllFiles = async function*(
  _client,
  pr,
) {
  const files = byRepo(pr.repo || pr).files;
  for (const file of files) {
    yield {
      path: file.path,
      getContents: async () => file.contents,
    };
  }
};

export const readComments: typeof real.readComments = async function*(
  _client,
  pr,
) {
  for (const comment of byPullRequest(pr).comments) {
    yield comment;
  }
};

export const writeComment: typeof real.writeComment = async (
  _client,
  pr,
  body,
  existingID,
) => {
  const comments = byPullRequest(pr).comments;
  if (existingID) {
    for (const comment of comments) {
      if (comment.commentID === existingID) {
        comment.body = body;
        return existingID;
      }
    }
    throw new Error(
      `Could not find comment ${existingID} on ${pr.repo.name}#${pr.number}`,
    );
  } else {
    const id = Math.max(0, ...comments.map((c) => c.commentID)) + 1;
    comments.push({
      commentID: id,
      body,
    });
    return id;
  }
};

export const deleteComment: typeof real.deleteComment = async (
  _client,
  pr,
  commentID,
) => {
  byPullRequest(pr).comments = byPullRequest(pr).comments.filter(
    (c) => c.commentID !== commentID,
  );
};

export const updateStatus: typeof real.updateStatus = async (
  _client,
  pr,
  status,
) => {
  const pullRequests = byRepo(pr.repo).pullRequests;
  if (!(pr.number in pullRequests)) {
    throw new Error(
      `The mock does not inclue a PR ${pr.number} in ${pr.repo.name}`,
    );
  }
  byPullRequest(pr).status = {
    state: status.state,
    url: status.url.href,
    description: status.description,
  };
};

export const getAllCommits: typeof real.getAllCommits = async function*(
  _client,
  repo,
) {
  const commits = byRepo(repo).commits;
  for (const commit of commits.slice().reverse()) {
    yield {
      oid: commit.sha,
      associatedPullRequests: commit.pullRequests.map((n) => ({number: n})),
    };
  }
};
