/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: zh9CAvQniuBxKA8jcgFeNBn1pWMUEabUS8rnC70TEbLFioSmoc/m6GVIAeinoBsg/ECndn0g5sRBEq0Xed654w==
 */

// eslint:disable
// tslint:disable

import DbGitCommit from './git_commits';
import DbGitRepository from './git_repositories';

interface DbPullRequest {
  change_set_submitted_at_git_commit_sha: string | null;
  comment_body: string | null;
  comment_id: number | null;
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  head_git_commit_id: DbGitCommit['id'] | null;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'pull_requests_id'};
  /**
   * @default false
   */
  is_closed: boolean;
  /**
   * @default false
   */
  is_merged: boolean;
  pr_number: number;
  title: string;
}
export default DbPullRequest;

interface PullRequests_InsertParameters {
  change_set_submitted_at_git_commit_sha?: string | null;
  comment_body?: string | null;
  comment_id?: number | null;
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  head_git_commit_id?: DbGitCommit['id'] | null;
  /**
   * The databaseId from GitHub
   */
  id: number & {readonly __brand?: 'pull_requests_id'};
  /**
   * @default false
   */
  is_closed?: boolean;
  /**
   * @default false
   */
  is_merged?: boolean;
  pr_number: number;
  title: string;
}
export type {PullRequests_InsertParameters};