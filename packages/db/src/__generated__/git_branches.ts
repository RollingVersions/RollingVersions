/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: olFg1PTLwHdYj1nfBfc3GXuv5R2e9CPUKQVCEi9az1ioXk35Asc54cb2o0yAlgD2UX5/41c6kWNCnK0gM5ObYw==
 */

// eslint:disable
// tslint:disable

import type DbGitCommit from './git_commits';
import type DbGitRepository from './git_repositories';

interface DbGitBranch {
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  /**
   * @default nextval('git_branches_id_seq'::regclass)
   */
  id: number & {readonly __brand?: 'git_branches_id'};
  name: string;
  target_git_commit_id: DbGitCommit['id'];
}
export default DbGitBranch;

interface GitBranches_InsertParameters {
  git_repository_id: DbGitRepository['id'];
  graphql_id: string;
  /**
   * @default nextval('git_branches_id_seq'::regclass)
   */
  id?: number & {readonly __brand?: 'git_branches_id'};
  name: string;
  target_git_commit_id: DbGitCommit['id'];
}
export type {GitBranches_InsertParameters};
