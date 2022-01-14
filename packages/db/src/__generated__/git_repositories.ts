/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: rW82FJ1VUmvU/R3iKyXyKBaqj2zAMHd5jQUMFcRtSH9ZDx5QYm/EgxpKv97tpwfHCeOIDf4QIhV/34CaUOkmoQ==
 */

// eslint:disable
// tslint:disable

interface DbGitRepository {
  default_branch_name: string;
  graphql_id: string;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'git_repositories_id'};
  /**
   * @default 0
   */
  local_git_version: number;
  name: string;
  owner: string;
  /**
   * @default 1
   */
  remote_git_version: number;
  uninstalled_at: Date | null;
}
export default DbGitRepository;

interface GitRepositories_InsertParameters {
  default_branch_name: string;
  graphql_id: string;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'git_repositories_id'};
  /**
   * @default 0
   */
  local_git_version?: number;
  name: string;
  owner: string;
  /**
   * @default 1
   */
  remote_git_version?: number;
  uninstalled_at?: Date | null;
}
export type {GitRepositories_InsertParameters};
