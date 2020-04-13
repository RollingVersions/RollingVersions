export interface PullRequestFixture {
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
export interface CommitFixture {
  tags: string[];
  sha: string;
  pullRequests: number[];
}
export interface RepoFixture {
  files: {path: string; contents: string}[];
  commits: CommitFixture[];
  pullRequests: Map<number, PullRequestFixture>;
}

export const repositories = new Map<string, RepoFixture>();

export function byDirectory(dirname: string) {
  expect(dirname).toMatch(/^\/repositories\/(.*)$/);
  const match = /^\/repositories\/(.*)$/.exec(dirname);
  const name = match![1];
  return byRepo({name});
}

export function byRepo({name}: {name: string}) {
  const r = repositories.get(name);
  if (!r) {
    throw new Error(`The mock does not support the repository ${name}`);
  }
  return r;
}

export function byPullRequest({
  number: n,
  repo,
}: {
  number: number;
  repo: {name: string};
}) {
  const r = byRepo(repo);
  const p = r.pullRequests.get(n);
  if (!p) {
    throw new Error(
      `The mock does not have a pull request ${n} in ${repo.name}`,
    );
  }
  return p;
}
