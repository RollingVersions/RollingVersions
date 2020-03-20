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

/**
 * The access level to a repository
 */
export enum RepositoryPermission {
  ADMIN = 'ADMIN',
  MAINTAIN = 'MAINTAIN',
  READ = 'READ',
  TRIAGE = 'TRIAGE',
  WRITE = 'WRITE',
}

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
// GraphQL query operation: GetPullRequestHeadSha
// ====================================================

export interface GetPullRequestHeadSha_repository_pullRequest_headRef_target {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestHeadSha_repository_pullRequest_headRef {
  /**
   * The object the ref points to.
   */
  target: GetPullRequestHeadSha_repository_pullRequest_headRef_target;
}

export interface GetPullRequestHeadSha_repository_pullRequest {
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: GetPullRequestHeadSha_repository_pullRequest_headRef | null;
}

export interface GetPullRequestHeadSha_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestHeadSha_repository_pullRequest | null;
}

export interface GetPullRequestHeadSha {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestHeadSha_repository | null;
}

export interface GetPullRequestHeadShaVariables {
  owner: string;
  name: string;
  number: number;
}

export const getPullRequestHeadSha = getMethod<
  GetPullRequestHeadSha,
  GetPullRequestHeadShaVariables
>(gql`
  query GetPullRequestHeadSha($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        headRef {
          target {
            oid
          }
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestFileNames
// ====================================================

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object {
  __typename: 'Commit' | 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object =
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree;

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object =
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree;

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object =
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Commit
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object_Tree;

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object =
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Commit
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object_Tree;

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries_object | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree_entries[]
    | null;
}

export type GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object =
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Commit
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object_Tree;

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries_object | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree {
  /**
   * A list of tree entries.
   */
  entries:
    | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree_entries[]
    | null;
}

export interface GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit {
  __typename: 'Commit';
  /**
   * Commit's root Tree
   */
  tree: GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit_tree;
}

export type GetPullRequestFileNames_repository_pullRequest_headRef_target =
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Tree
  | GetPullRequestFileNames_repository_pullRequest_headRef_target_Commit;

export interface GetPullRequestFileNames_repository_pullRequest_headRef {
  /**
   * The object the ref points to.
   */
  target: GetPullRequestFileNames_repository_pullRequest_headRef_target;
}

export interface GetPullRequestFileNames_repository_pullRequest {
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: GetPullRequestFileNames_repository_pullRequest_headRef | null;
}

export interface GetPullRequestFileNames_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestFileNames_repository_pullRequest | null;
}

export interface GetPullRequestFileNames {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestFileNames_repository | null;
}

export interface GetPullRequestFileNamesVariables {
  owner: string;
  name: string;
  number: number;
}

export const getPullRequestFileNames = getMethod<
  GetPullRequestFileNames,
  GetPullRequestFileNamesVariables
>(gql`
  query GetPullRequestFileNames(
    $owner: String!
    $name: String!
    $number: Int!
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        headRef {
          target {
            __typename
            ... on Commit {
              tree {
                ...FullContents
              }
            }
          }
        }
      }
    }
  }
  fragment FullContents on Tree {
    entries {
      name
      object {
        __typename
        oid
        ... on Tree {
          entries {
            name
            object {
              __typename
              oid
              ... on Tree {
                entries {
                  name
                  object {
                    __typename
                    oid
                    ... on Tree {
                      entries {
                        name
                        object {
                          __typename
                          oid
                          ... on Tree {
                            entries {
                              name
                              object {
                                __typename
                                oid
                                ... on Tree {
                                  entries {
                                    name
                                    object {
                                      __typename
                                      oid
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
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

// ====================================================
// GraphQL query operation: GetFile
// ====================================================

export interface GetFile_repository_object_Commit {
  __typename: 'Commit' | 'Tree' | 'Tag';
}

export interface GetFile_repository_object_Blob {
  __typename: 'Blob';
  /**
   * UTF8 text data or null if the Blob is binary
   */
  text: string | null;
}

export type GetFile_repository_object =
  | GetFile_repository_object_Commit
  | GetFile_repository_object_Blob;

export interface GetFile_repository {
  /**
   * A Git object in the repository
   */
  object: GetFile_repository_object | null;
}

export interface GetFile {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetFile_repository | null;
}

export interface GetFileVariables {
  owner: string;
  name: string;
  oid: GitObjectID;
}

export const getFile = getMethod<GetFile, GetFileVariables>(gql`
  query GetFile($owner: String!, $name: String!, $oid: GitObjectID!) {
    repository(owner: $owner, name: $name) {
      object(oid: $oid) {
        __typename
        ... on Blob {
          text
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestComments
// ====================================================

export interface GetPullRequestComments_repository_pullRequest_comments_pageInfo {
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
}

export interface GetPullRequestComments_repository_pullRequest_comments_nodes {
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * The body as Markdown.
   */
  body: string;
}

export interface GetPullRequestComments_repository_pullRequest_comments {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetPullRequestComments_repository_pullRequest_comments_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetPullRequestComments_repository_pullRequest_comments_nodes | null)[]
    | null;
}

export interface GetPullRequestComments_repository_pullRequest {
  /**
   * A list of comments associated with the pull request.
   */
  comments: GetPullRequestComments_repository_pullRequest_comments;
}

export interface GetPullRequestComments_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestComments_repository_pullRequest | null;
}

export interface GetPullRequestComments {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestComments_repository | null;
}

export interface GetPullRequestCommentsVariables {
  owner: string;
  name: string;
  number: number;
  after?: string | null;
}

export const getPullRequestComments = getMethod<
  GetPullRequestComments,
  GetPullRequestCommentsVariables
>(gql`
  query GetPullRequestComments(
    $owner: String!
    $name: String!
    $number: Int!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        comments(first: 5, after: $after) {
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            databaseId
            body
          }
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestsForCommit
// ====================================================

export interface GetPullRequestsForCommit_repository_object_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
}

export interface GetPullRequestsForCommit_repository_object_Commit_associatedPullRequests_nodes {
  /**
   * Identifies the pull request number.
   */
  number: number;
}

export interface GetPullRequestsForCommit_repository_object_Commit_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetPullRequestsForCommit_repository_object_Commit_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetPullRequestsForCommit_repository_object_Commit {
  __typename: 'Commit';
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetPullRequestsForCommit_repository_object_Commit_associatedPullRequests | null;
}

export type GetPullRequestsForCommit_repository_object =
  | GetPullRequestsForCommit_repository_object_Tree
  | GetPullRequestsForCommit_repository_object_Commit;

export interface GetPullRequestsForCommit_repository {
  /**
   * A Git object in the repository
   */
  object: GetPullRequestsForCommit_repository_object | null;
}

export interface GetPullRequestsForCommit {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestsForCommit_repository | null;
}

export interface GetPullRequestsForCommitVariables {
  owner: string;
  name: string;
  sha: string;
}

export const getPullRequestsForCommit = getMethod<
  GetPullRequestsForCommit,
  GetPullRequestsForCommitVariables
>(gql`
  query GetPullRequestsForCommit(
    $owner: String!
    $name: String!
    $sha: String!
  ) {
    repository(owner: $owner, name: $name) {
      object(expression: $sha) {
        __typename
        ... on Commit {
          associatedPullRequests(first: 10) {
            nodes {
              number
            }
          }
        }
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRepositoryViewerPermissions
// ====================================================

export interface GetRepositoryViewerPermissions_repository {
  /**
   * The users permission level on the repository. Will return null if authenticated as an GitHub App.
   */
  viewerPermission: RepositoryPermission | null;
}

export interface GetRepositoryViewerPermissions {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepositoryViewerPermissions_repository | null;
}

export interface GetRepositoryViewerPermissionsVariables {
  owner: string;
  name: string;
}

export const getRepositoryViewerPermissions = getMethod<
  GetRepositoryViewerPermissions,
  GetRepositoryViewerPermissionsVariables
>(gql`
  query GetRepositoryViewerPermissions($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      viewerPermission
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
// GraphQL query operation: GetBranch
// ====================================================

export interface GetBranch_repository_branch_target {
  __typename: 'Commit' | 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetBranch_repository_branch {
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetBranch_repository_branch_target;
}

export interface GetBranch_repository {
  /**
   * Fetch a given ref from the repository
   */
  branch: GetBranch_repository_branch | null;
}

export interface GetBranch {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetBranch_repository | null;
}

export interface GetBranchVariables {
  owner: string;
  name: string;
  qualifiedName: string;
}

export const getBranch = getMethod<GetBranch, GetBranchVariables>(gql`
  query GetBranch($owner: String!, $name: String!, $qualifiedName: String!) {
    repository(owner: $owner, name: $name) {
      branch: ref(qualifiedName: $qualifiedName) {
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
// GraphQL fragment: FullContents
// ====================================================

export interface FullContents_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface FullContents_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit {
  __typename: 'Commit' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object {
  __typename: 'Commit' | 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object =
  | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit
  | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree;

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object =
  | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Commit
  | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object_Tree;

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type FullContents_entries_object_Tree_entries_object_Tree_entries_object =
  | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Commit
  | FullContents_entries_object_Tree_entries_object_Tree_entries_object_Tree;

export interface FullContents_entries_object_Tree_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: FullContents_entries_object_Tree_entries_object_Tree_entries_object | null;
}

export interface FullContents_entries_object_Tree_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries:
    | FullContents_entries_object_Tree_entries_object_Tree_entries[]
    | null;
}

export type FullContents_entries_object_Tree_entries_object =
  | FullContents_entries_object_Tree_entries_object_Commit
  | FullContents_entries_object_Tree_entries_object_Tree;

export interface FullContents_entries_object_Tree_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: FullContents_entries_object_Tree_entries_object | null;
}

export interface FullContents_entries_object_Tree {
  __typename: 'Tree';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * A list of tree entries.
   */
  entries: FullContents_entries_object_Tree_entries[] | null;
}

export type FullContents_entries_object =
  | FullContents_entries_object_Commit
  | FullContents_entries_object_Tree;

export interface FullContents_entries {
  /**
   * Entry file name.
   */
  name: string;
  /**
   * Entry file object.
   */
  object: FullContents_entries_object | null;
}

export interface FullContents {
  /**
   * A list of tree entries.
   */
  entries: FullContents_entries[] | null;
}
