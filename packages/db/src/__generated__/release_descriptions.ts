/**
 * !!! This file is autogenerated do not edit by hand !!!
 *
 * Generated by: @databases/pg-schema-print-types
 * Checksum: FBEhMLbn67R6lyz2/SCXzK5RZqBuiWtdjWPWbomzh5V63Ig2aEr1YayrgUDLAyo3XW0Wv3Aw7Cj00PBHyvGeMg==
 */

// eslint:disable
// tslint:disable

import DbGitRepository from './git_repositories';

interface DbReleaseDescription {
  current_version: string;
  git_repository_id: DbGitRepository['id'];
  /**
   * @default nextval('release_descriptions_id_seq'::regclass)
   */
  id: number & {readonly __brand?: 'release_descriptions_id'};
  package_name: string;
  release_description: string;
  updated_at: Date;
}
export default DbReleaseDescription;

interface ReleaseDescriptions_InsertParameters {
  current_version: string;
  git_repository_id: DbGitRepository['id'];
  /**
   * @default nextval('release_descriptions_id_seq'::regclass)
   */
  id?: number & {readonly __brand?: 'release_descriptions_id'};
  package_name: string;
  release_description: string;
  updated_at: Date;
}
export type {ReleaseDescriptions_InsertParameters};
