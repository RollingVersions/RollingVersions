import {
  RepoFixture,
  repositories,
  PullRequestFixture,
  CommitFixture,
} from './fixtures';

jest.mock('../github', () => require('./github'));
jest.mock('../git', () => require('./git'));

const names = [
  'apple',
  'banana',
  'coconut',
  'lemon',
  'lime',
  'mango',
  'orange',
  'peach',
  'pear',
  'pineapple',
];

export function createRepository(
  partialRepo: {commits?: Partial<CommitFixture>[]} & Partial<
    Omit<RepoFixture, 'commits'>
  > = {},
) {
  if (!names.length) {
    throw new Error('Maximum repo count supported by mock reached');
  }

  let nextCommit = 1;
  function getSha() {
    return `COMMIT_SHA_${nextCommit++}`;
  }

  const name = names.pop()!;

  const repo = {owner: name, name};
  const repoFixture: RepoFixture = {
    files: [],
    pullRequests: new Map(),
    ...partialRepo,
    commits: (partialRepo.commits || []).map((c) => ({
      sha: c.sha || getSha(),
      tags: [],
      pullRequests: [],
      ...c,
    })),
  };
  repositories.set(name, repoFixture);

  return {
    repo,
    dirname: `/repositories/${name}`,
    repoFixture,
    newCommit(c: Partial<CommitFixture> = {}) {
      const commitFixture: CommitFixture = {
        sha: c.sha || getSha(),
        tags: [],
        pullRequests: [],
        ...c,
      };
      repoFixture.commits.push(commitFixture);
      return commitFixture;
    },
    newPullRequest(partialPullRequest: Partial<PullRequestFixture> = {}) {
      const n = Math.max(0, ...repoFixture.pullRequests.keys()) + 1;
      const pullRequestFixture: PullRequestFixture = {
        headSha:
          partialPullRequest.headSha !== undefined
            ? partialPullRequest.headSha
            : getSha(),
        closed: false,
        merged: false,
        status: undefined,
        comments: [],
        ...partialPullRequest,
      };
      repoFixture.pullRequests.set(n, pullRequestFixture);
      return {
        pullRequest: {number: n, repo},
        pullRequestFixture,
      };
    },
  };
}
