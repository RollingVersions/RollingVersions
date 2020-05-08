/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

import {getMethod, gql} from '@github-graph/api';

/**
 * An ISO-8601 encoded date string
 */
export type Date = string;
/**
 * An ISO-8601 encoded UTC date string
 */
export type DateTime = string;
/**
 * A Git object ID
 */
export type GitObjectID = string;
/**
 * A fully qualified reference name (e.g. "refs/heads/master")
 */
export type GitRefname = string;
/**
 * Git SSH string
 */
export type GitSSHRemote = string;
/**
 * An ISO-8601 encoded date string. Unlike the DateTime type, GitTimestamp is not converted in UTC.
 */
export type GitTimestamp = string;
/**
 * A string containing HTML code.
 */
export type HTML = string;
/**
 * An ISO-8601 encoded UTC date string with millisecond precison.
 */
export type PreciseDateTime = string;
/**
 * An RFC 3986, RFC 3987, and RFC 6570 (level 4) compliant URI string.
 */
export type URI = string;
/**
 * A valid x509 certificate string
 */
export type X509Certificate = string;

//==============================================================
// START Enums and Input Objects
//==============================================================

//==============================================================
// END Enums and Input Objects
//==============================================================

// ====================================================
// GraphQL query operation: GetTags
// ====================================================

export interface GetTags_repository_refs_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetTags_repository_refs_nodes_target {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetTags_repository_refs_nodes {
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetTags_repository_refs_nodes_target;
}

export interface GetTags_repository_refs {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetTags_repository_refs_pageInfo;
  /**
   * A list of nodes.
   */
  nodes: (GetTags_repository_refs_nodes | null)[] | null;
}

export interface GetTags_repository {
  /**
   * Fetch a list of refs from the repository
   */
  refs: GetTags_repository_refs | null;
}

export interface GetTags {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetTags_repository | null;
}

export interface GetTagsVariables {
  owner: string;
  name: string;
  after?: string | null;
}

export const getTags = getMethod<GetTags, GetTagsVariables>(gql`
  query GetTags($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      refs(first: 100, after: $after, refPrefix: "refs/tags/") {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name
          target {
            oid
          }
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepository
// ====================================================

export interface GetRepository_repository {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  id: string;
}

export interface GetRepository {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepository_repository | null;
}

export interface GetRepositoryVariables {
  owner: string;
  name: string;
}

export const getRepository = getMethod<
  GetRepository,
  GetRepositoryVariables
>(gql`
  query GetRepository($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      databaseId
      id
    }
  }
`);

// ====================================================
// GraphQL query operation: GetDefaultBranch
// ====================================================

export interface GetDefaultBranch_repository_branch_target {
  __typename: 'Commit' | 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetDefaultBranch_repository_branch {
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetDefaultBranch_repository_branch_target;
}

export interface GetDefaultBranch_repository {
  /**
   * The Ref associated with the repository's default branch.
   */
  branch: GetDefaultBranch_repository_branch | null;
}

export interface GetDefaultBranch {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetDefaultBranch_repository | null;
}

export interface GetDefaultBranchVariables {
  owner: string;
  name: string;
}

export const getDefaultBranch = getMethod<
  GetDefaultBranch,
  GetDefaultBranchVariables
>(gql`
  query GetDefaultBranch($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      branch: defaultBranchRef {
        name
        target {
          __typename
          oid
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetAllDefaultBranchCommitsFromTail
// ====================================================

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating backwards, the cursor to continue.
   */
  startCursor: string | null;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes {
  /**
   * Identifies the pull request number.
   */
  number: number;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit_history;
}

export type GetAllDefaultBranchCommitsFromTail_repository_branch_target =
  | GetAllDefaultBranchCommitsFromTail_repository_branch_target_Tree
  | GetAllDefaultBranchCommitsFromTail_repository_branch_target_Commit;

export interface GetAllDefaultBranchCommitsFromTail_repository_branch {
  /**
   * The object the ref points to.
   */
  target: GetAllDefaultBranchCommitsFromTail_repository_branch_target;
}

export interface GetAllDefaultBranchCommitsFromTail_repository {
  /**
   * The Ref associated with the repository's default branch.
   */
  branch: GetAllDefaultBranchCommitsFromTail_repository_branch | null;
}

export interface GetAllDefaultBranchCommitsFromTail {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllDefaultBranchCommitsFromTail_repository | null;
}

export interface GetAllDefaultBranchCommitsFromTailVariables {
  owner: string;
  name: string;
  before?: string | null;
}

export const getAllDefaultBranchCommitsFromTail = getMethod<
  GetAllDefaultBranchCommitsFromTail,
  GetAllDefaultBranchCommitsFromTailVariables
>(gql`
  query GetAllDefaultBranchCommitsFromTail(
    $owner: String!
    $name: String!
    $before: String
  ) {
    repository(owner: $owner, name: $name) {
      branch: defaultBranchRef {
        target {
          __typename
          oid
          ... on Commit {
            id
            history(last: 100, before: $before) {
              pageInfo {
                hasNextPage
                startCursor
              }
              nodes {
                id
                oid
                parents(first: 100) {
                  nodes {
                    oid
                  }
                }
                associatedPullRequests(first: 100) {
                  nodes {
                    number
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`);
