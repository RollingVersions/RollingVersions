/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: CwHN90TDa6JbpYCo2Fcop5v5O9FVWzPFmep3w6W5HUg7/fXfFMZWVCaKRM93J73cmVH0vI4I9hTPPx3ajtuH8Q==
 */

// eslint:disable
// tslint:disable

import DbGitRepository from './git_repositories';

interface DbPullRequest {
  base_ref_name: string | null;
  change_set_submitted_at_git_commit_sha: string | null;
  comment_id: number | null;
  comment_updated_at_commit_sha: string | null;
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  head_ref_name: string | null;
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
  merge_commit_sha: string | null;
  pr_number: number;
  status_updated_at_commit_sha: string | null;
  title: string;
}
export default DbPullRequest;

interface PullRequests_InsertParameters {
  base_ref_name?: string | null;
  change_set_submitted_at_git_commit_sha?: string | null;
  comment_id?: number | null;
  comment_updated_at_commit_sha?: string | null;
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  head_ref_name?: string | null;
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
  merge_commit_sha?: string | null;
  pr_number: number;
  status_updated_at_commit_sha?: string | null;
  title: string;
}
export type {PullRequests_InsertParameters};
