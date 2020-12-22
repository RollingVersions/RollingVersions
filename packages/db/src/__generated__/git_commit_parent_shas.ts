/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: z896pTJ4icZN3VPRJigclGm8s3P91nZs38pmalwYRKm9u3WQ0xV7nsyjgBXjBR3cNU9pMcVNDGEsdRZUcSFLmQ==
 */

// eslint:disable
// tslint:disable

import DbGitCommitParentCursor from './git_commit_parent_cursors';
import DbGitCommit from './git_commits';
import DbGitRepository from './git_repositories';

interface DbGitCommitParentSha {
  child_git_commit_id: DbGitCommit['id'];
  git_repository_id: DbGitRepository['id'];
  /**
   * @default nextval('git_commit_parent_shas_id_seq'::regclass)
   */
  id: number & {readonly __brand?: 'git_commit_parent_shas_id'};
  parent_cursor_id: DbGitCommitParentCursor['id'];
  parent_git_commit_sha: string;
}
export default DbGitCommitParentSha;

interface GitCommitParentShas_InsertParameters {
  child_git_commit_id: DbGitCommit['id'];
  git_repository_id: DbGitRepository['id'];
  /**
   * @default nextval('git_commit_parent_shas_id_seq'::regclass)
   */
  id?: number & {readonly __brand?: 'git_commit_parent_shas_id'};
  parent_cursor_id: DbGitCommitParentCursor['id'];
  parent_git_commit_sha: string;
}
export type {GitCommitParentShas_InsertParameters};
