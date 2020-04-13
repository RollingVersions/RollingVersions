interface RepoFixture {
  tags: {name: string; commitSha: string}[];
  files: {path: string; contents: string}[];
  commits: {sha: string; pullRequests: number[]}[];
  pullRequests: Record<
    number,
    {
      headSha: string | null;
      closed: boolean;
      merged: boolean;
      status?: {
        state: 'success' | 'pending' | 'error' | 'failure';
        url: string;
        description: string;
      };
      comments: {commentID: number; body: string}[];
    }
  >;
}
function repoFixture(repo: RepoFixture) {
  return repo;
}
const GitHubRepositories = {
  single: repoFixture({
    tags: [
      {
        name: 'single-package@1.0.0',
        commitSha: 'COMMIT_SHA_SINGLE_PACKAGE_1.0.0',
      },
    ],
    files: [
      {
        path: 'package.json',
        contents: '{"name": "single-package"}',
      },
    ],
    commits: [
      {sha: 'COMMIT_SHA_SINGLE_PACKAGE_NEW_COMMIT', pullRequests: [1]},
      {sha: 'COMMIT_SHA_SINGLE_PACKAGE_1.0.0', pullRequests: []},
    ],
    pullRequests: {
      1: {headSha: null, closed: true, merged: true, comments: []},
    },
  }),
  monorepo: repoFixture({
    tags: [
      {name: 'package-a@1.0.0', commitSha: 'COMMIT_SHA_PACKAGE_A_1.0.0'},
      {name: 'package-b@1.0.0', commitSha: 'COMMIT_SHA_PACKAGE_B_1.0.0'},
    ],
    files: [
      {
        path: 'package.json',
        contents: '{"name": "monorepo", "private": true}',
      },
      {
        path: 'packages/a/package.json',
        contents: '{"name": "package-a"}',
      },
      {
        path: 'packages/b/package.json',
        contents: '{"name": "package-b"}',
      },
    ],
    commits: [
      {sha: 'COMMIT_SHA_NEW_COMMIT_A', pullRequests: [2]},
      {sha: 'COMMIT_SHA_PACKAGE_A_1.0.0', pullRequests: []},
      {sha: 'COMMIT_SHA_NEW_COMMIT_B', pullRequests: [1]},
      {sha: 'COMMIT_SHA_PACKAGE_B_1.0.0', pullRequests: []},
    ],
    pullRequests: {
      1: {headSha: null, closed: true, merged: true, comments: []},
      2: {headSha: null, closed: true, merged: true, comments: []},
    },
  }),
};

function isKeyOf<T>(value: string, obj: T): value is string & keyof T {
  return value in obj;
}

export function byDirectory(dirname: string) {
  expect(dirname).toMatch(/^\/repositories\/(.*)$/);
  const match = /^\/repositories\/(.*)$/.exec(dirname);
  const name = match![1];
  return byRepo({name});
}

export function byRepo({name}: {name: string}) {
  if (isKeyOf(name, GitHubRepositories)) {
    return GitHubRepositories[name];
  } else {
    throw new Error(`The mock does not support the repository ${name}`);
  }
}
