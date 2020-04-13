export interface Repository {
  owner: string;
  name: string;
}
export interface PullRequest {
  repo: Repository;
  number: number;
  headSha: string;
}
