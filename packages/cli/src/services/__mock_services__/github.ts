import * as real from '../github';
import {byRepo} from './fixtures';
import {RepositoryPermission} from '../github/github-graph';

export const getPullRequestHeadSha: typeof real.getPullRequestHeadSha = async (
  _client,
  pr,
) => {
  const pullRequests = byRepo(pr.repo).pullRequests;
  if (!(pr.number in pullRequests)) {
    throw new Error(
      `The mock does not inclue a PR ${pr.number} in ${pr.repo.name}`,
    );
  }
  return pullRequests[pr.number].headSha || undefined;
};

export const getPullRequestStatus: typeof real.getPullRequestStatus = async (
  _client,
  pr,
) => {
  const pullRequests = byRepo(pr.repo).pullRequests;
  if (!(pr.number in pullRequests)) {
    throw new Error(
      `The mock does not inclue a PR ${pr.number} in ${pr.repo.name}`,
    );
  }
  return {
    closed: pullRequests[pr.number].closed,
    merged: pullRequests[pr.number].merged,
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
  return byRepo(repo).tags;
};

export const getAllFiles: typeof real.getAllFiles = async function*(
  _client,
  pr,
) {
  const files = byRepo(pr.repo).files;
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
  const pullRequests = byRepo(pr.repo).pullRequests;
  if (!(pr.number in pullRequests)) {
    throw new Error(
      `The mock does not inclue a PR ${pr.number} in ${pr.repo.name}`,
    );
  }
  for (const comment of pullRequests[pr.number].comments) {
    yield comment;
  }
};

export const writeComment: typeof real.writeComment = async (
  _client,
  pr,
  body,
  existingID,
) => {
  const pullRequests = byRepo(pr.repo).pullRequests;
  if (!(pr.number in pullRequests)) {
    throw new Error(
      `The mock does not inclue a PR ${pr.number} in ${pr.repo.name}`,
    );
  }
  const comments = pullRequests[pr.number].comments;
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
  const pullRequests = byRepo(pr.repo).pullRequests;
  if (!(pr.number in pullRequests)) {
    throw new Error(
      `The mock does not inclue a PR ${pr.number} in ${pr.repo.name}`,
    );
  }
  pullRequests[pr.number].comments = pullRequests[pr.number].comments.filter(
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
  pullRequests[pr.number].status = {
    state: status.state,
    url: status.url.href,
    description: status.description,
  };
};

export const getPullRequestsForCommit: typeof real.getPullRequestsForCommit = async (
  _client,
  repo,
  sha,
) => {
  const commit = byRepo(repo).commits.find((c) => c.sha === sha);
  if (!commit) {
    throw new Error(`The mock has no commit ${sha} in ${repo.name}`);
  }
  return commit.pullRequests;
};
