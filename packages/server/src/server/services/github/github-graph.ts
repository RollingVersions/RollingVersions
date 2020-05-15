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
// GraphQL query operation: GetRepositoryPullRequests
// ====================================================

export interface GetRepositoryPullRequests_repository_pullRequests_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetRepositoryPullRequests_repository_pullRequests_nodes {
  id: string;
}

export interface GetRepositoryPullRequests_repository_pullRequests {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetRepositoryPullRequests_repository_pullRequests_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetRepositoryPullRequests_repository_pullRequests_nodes | null)[]
    | null;
}

export interface GetRepositoryPullRequests_repository {
  /**
   * A list of pull requests that have been opened in the repository.
   */
  pullRequests: GetRepositoryPullRequests_repository_pullRequests;
}

export interface GetRepositoryPullRequests {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRepositoryPullRequests_repository | null;
}

export interface GetRepositoryPullRequestsVariables {
  owner: string;
  name: string;
  after?: string | null;
}

export const getRepositoryPullRequests = getMethod<
  GetRepositoryPullRequests,
  GetRepositoryPullRequestsVariables
>(gql`
  query GetRepositoryPullRequests(
    $owner: String!
    $name: String!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      pullRequests(first: 100, after: $after, states: [CLOSED, MERGED, OPEN]) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
        }
      }
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
  id: string;
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
        id
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
// GraphQL query operation: GetAllDefaultBranchCommits
// ====================================================

export interface GetAllDefaultBranchCommits_repository_branch_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllDefaultBranchCommits_repository_branch_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllDefaultBranchCommits_repository_branch_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllDefaultBranchCommits_repository_branch_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllDefaultBranchCommits_repository_branch_target_Commit_history;
}

export type GetAllDefaultBranchCommits_repository_branch_target =
  | GetAllDefaultBranchCommits_repository_branch_target_Tree
  | GetAllDefaultBranchCommits_repository_branch_target_Commit;

export interface GetAllDefaultBranchCommits_repository_branch {
  /**
   * The object the ref points to.
   */
  target: GetAllDefaultBranchCommits_repository_branch_target;
}

export interface GetAllDefaultBranchCommits_repository {
  /**
   * The Ref associated with the repository's default branch.
   */
  branch: GetAllDefaultBranchCommits_repository_branch | null;
}

export interface GetAllDefaultBranchCommits {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllDefaultBranchCommits_repository | null;
}

export interface GetAllDefaultBranchCommitsVariables {
  owner: string;
  name: string;
  after?: string | null;
}

export const getAllDefaultBranchCommits = getMethod<
  GetAllDefaultBranchCommits,
  GetAllDefaultBranchCommitsVariables
>(gql`
  query GetAllDefaultBranchCommits(
    $owner: String!
    $name: String!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      branch: defaultBranchRef {
        target {
          __typename
          oid
          ... on Commit {
            id
            history(first: 100, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitDetail
              }
            }
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetRef
// ====================================================

export interface GetRef_repository_ref_target {
  __typename: 'Commit' | 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetRef_repository_ref {
  id: string;
  /**
   * The ref name.
   */
  name: string;
  /**
   * The object the ref points to.
   */
  target: GetRef_repository_ref_target;
}

export interface GetRef_repository {
  /**
   * Fetch a given ref from the repository
   */
  ref: GetRef_repository_ref | null;
}

export interface GetRef {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetRef_repository | null;
}

export interface GetRefVariables {
  owner: string;
  name: string;
  qualifiedName: string;
}

export const getRef = getMethod<GetRef, GetRefVariables>(gql`
  query GetRef($owner: String!, $name: String!, $qualifiedName: String!) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $qualifiedName) {
        id
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
// GraphQL query operation: GetAllRefCommits
// ====================================================

export interface GetAllRefCommits_repository_ref_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllRefCommits_repository_ref_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllRefCommits_repository_ref_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllRefCommits_repository_ref_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllRefCommits_repository_ref_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllRefCommits_repository_ref_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllRefCommits_repository_ref_target_Commit_history;
}

export type GetAllRefCommits_repository_ref_target =
  | GetAllRefCommits_repository_ref_target_Tree
  | GetAllRefCommits_repository_ref_target_Commit;

export interface GetAllRefCommits_repository_ref {
  /**
   * The object the ref points to.
   */
  target: GetAllRefCommits_repository_ref_target;
}

export interface GetAllRefCommits_repository {
  /**
   * Fetch a given ref from the repository
   */
  ref: GetAllRefCommits_repository_ref | null;
}

export interface GetAllRefCommits {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllRefCommits_repository | null;
}

export interface GetAllRefCommitsVariables {
  owner: string;
  name: string;
  qualifiedName: string;
  after?: string | null;
}

export const getAllRefCommits = getMethod<
  GetAllRefCommits,
  GetAllRefCommitsVariables
>(gql`
  query GetAllRefCommits(
    $owner: String!
    $name: String!
    $qualifiedName: String!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      ref(qualifiedName: $qualifiedName) {
        target {
          __typename
          oid
          ... on Commit {
            id
            history(first: 20, after: $after) {
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                ...CommitDetail
              }
            }
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
      }
    }
  }
`);

// ====================================================
// GraphQL query operation: GetPullRequestFromGraphID
// ====================================================

export interface GetPullRequestFromGraphID_node_CodeOfConduct {
  __typename:
    | 'CodeOfConduct'
    | 'Enterprise'
    | 'EnterpriseUserAccount'
    | 'Organization'
    | 'RegistryPackage'
    | 'RegistryPackageVersion'
    | 'RegistryPackageDependency'
    | 'RegistryPackageFile'
    | 'Release'
    | 'User'
    | 'Project'
    | 'ProjectColumn'
    | 'ProjectCard'
    | 'Issue'
    | 'UserContentEdit'
    | 'Label'
    | 'Reaction'
    | 'Repository'
    | 'License'
    | 'BranchProtectionRule'
    | 'Ref'
    | 'PushAllowance'
    | 'App'
    | 'Team'
    | 'UserStatus'
    | 'TeamDiscussion'
    | 'TeamDiscussionComment'
    | 'OrganizationInvitation'
    | 'ReviewDismissalAllowance'
    | 'CommitComment'
    | 'Commit'
    | 'Deployment'
    | 'DeploymentStatus'
    | 'Status'
    | 'StatusContext'
    | 'StatusCheckRollup'
    | 'Tree'
    | 'DeployKey'
    | 'Language'
    | 'Milestone'
    | 'RepositoryTopic'
    | 'Topic'
    | 'RepositoryVulnerabilityAlert'
    | 'SecurityAdvisory'
    | 'IssueComment'
    | 'PullRequestCommit'
    | 'ReviewRequest'
    | 'Mannequin'
    | 'PullRequestReviewThread'
    | 'PullRequestReviewComment'
    | 'PullRequestReview'
    | 'AssignedEvent'
    | 'Bot'
    | 'BaseRefForcePushedEvent'
    | 'ClosedEvent'
    | 'CommitCommentThread'
    | 'CrossReferencedEvent'
    | 'DemilestonedEvent'
    | 'DeployedEvent'
    | 'DeploymentEnvironmentChangedEvent'
    | 'HeadRefDeletedEvent'
    | 'HeadRefForcePushedEvent'
    | 'HeadRefRestoredEvent'
    | 'LabeledEvent'
    | 'LockedEvent'
    | 'MergedEvent'
    | 'MilestonedEvent'
    | 'ReferencedEvent'
    | 'RenamedTitleEvent'
    | 'ReopenedEvent'
    | 'ReviewDismissedEvent'
    | 'ReviewRequestRemovedEvent'
    | 'ReviewRequestedEvent'
    | 'SubscribedEvent'
    | 'UnassignedEvent'
    | 'UnlabeledEvent'
    | 'UnlockedEvent'
    | 'UnsubscribedEvent'
    | 'UserBlockedEvent'
    | 'AddedToProjectEvent'
    | 'BaseRefChangedEvent'
    | 'CommentDeletedEvent'
    | 'ConnectedEvent'
    | 'ConvertedNoteToIssueEvent'
    | 'DisconnectedEvent'
    | 'MarkedAsDuplicateEvent'
    | 'MentionedEvent'
    | 'MovedColumnsInProjectEvent'
    | 'PinnedEvent'
    | 'PullRequestCommitCommentThread'
    | 'ReadyForReviewEvent'
    | 'RemovedFromProjectEvent'
    | 'TransferredEvent'
    | 'UnmarkedAsDuplicateEvent'
    | 'UnpinnedEvent'
    | 'Gist'
    | 'GistComment'
    | 'SponsorsListing'
    | 'SponsorsTier'
    | 'Sponsorship'
    | 'PublicKey'
    | 'SavedReply'
    | 'ReleaseAsset'
    | 'RegistryPackageTag'
    | 'MembersCanDeleteReposClearAuditEntry'
    | 'MembersCanDeleteReposDisableAuditEntry'
    | 'MembersCanDeleteReposEnableAuditEntry'
    | 'OauthApplicationCreateAuditEntry'
    | 'OrgAddBillingManagerAuditEntry'
    | 'OrgAddMemberAuditEntry'
    | 'OrgBlockUserAuditEntry'
    | 'OrgConfigDisableCollaboratorsOnlyAuditEntry'
    | 'OrgConfigEnableCollaboratorsOnlyAuditEntry'
    | 'OrgCreateAuditEntry'
    | 'OrgDisableOauthAppRestrictionsAuditEntry'
    | 'OrgDisableSamlAuditEntry'
    | 'OrgDisableTwoFactorRequirementAuditEntry'
    | 'OrgEnableOauthAppRestrictionsAuditEntry'
    | 'OrgEnableSamlAuditEntry'
    | 'OrgEnableTwoFactorRequirementAuditEntry'
    | 'OrgInviteMemberAuditEntry'
    | 'OrgInviteToBusinessAuditEntry'
    | 'OrgOauthAppAccessApprovedAuditEntry'
    | 'OrgOauthAppAccessDeniedAuditEntry'
    | 'OrgOauthAppAccessRequestedAuditEntry'
    | 'OrgRemoveBillingManagerAuditEntry'
    | 'OrgRemoveMemberAuditEntry'
    | 'OrgRemoveOutsideCollaboratorAuditEntry'
    | 'OrgRestoreMemberAuditEntry'
    | 'OrgUnblockUserAuditEntry'
    | 'OrgUpdateDefaultRepositoryPermissionAuditEntry'
    | 'OrgUpdateMemberAuditEntry'
    | 'OrgUpdateMemberRepositoryCreationPermissionAuditEntry'
    | 'OrgUpdateMemberRepositoryInvitationPermissionAuditEntry'
    | 'PrivateRepositoryForkingDisableAuditEntry'
    | 'PrivateRepositoryForkingEnableAuditEntry'
    | 'RepoAccessAuditEntry'
    | 'RepoAddMemberAuditEntry'
    | 'RepoAddTopicAuditEntry'
    | 'RepoArchivedAuditEntry'
    | 'RepoChangeMergeSettingAuditEntry'
    | 'RepoConfigDisableAnonymousGitAccessAuditEntry'
    | 'RepoConfigDisableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigDisableContributorsOnlyAuditEntry'
    | 'RepoConfigDisableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigEnableAnonymousGitAccessAuditEntry'
    | 'RepoConfigEnableCollaboratorsOnlyAuditEntry'
    | 'RepoConfigEnableContributorsOnlyAuditEntry'
    | 'RepoConfigEnableSockpuppetDisallowedAuditEntry'
    | 'RepoConfigLockAnonymousGitAccessAuditEntry'
    | 'RepoConfigUnlockAnonymousGitAccessAuditEntry'
    | 'RepoCreateAuditEntry'
    | 'RepoDestroyAuditEntry'
    | 'RepoRemoveMemberAuditEntry'
    | 'RepoRemoveTopicAuditEntry'
    | 'RepositoryVisibilityChangeDisableAuditEntry'
    | 'RepositoryVisibilityChangeEnableAuditEntry'
    | 'TeamAddMemberAuditEntry'
    | 'TeamAddRepositoryAuditEntry'
    | 'TeamChangeParentTeamAuditEntry'
    | 'TeamRemoveMemberAuditEntry'
    | 'TeamRemoveRepositoryAuditEntry'
    | 'OrganizationIdentityProvider'
    | 'ExternalIdentity'
    | 'EnterpriseServerInstallation'
    | 'EnterpriseServerUserAccount'
    | 'EnterpriseServerUserAccountEmail'
    | 'EnterpriseServerUserAccountsUpload'
    | 'IpAllowListEntry'
    | 'EnterpriseRepositoryInfo'
    | 'EnterpriseAdministratorInvitation'
    | 'EnterpriseIdentityProvider'
    | 'MarketplaceCategory'
    | 'MarketplaceListing'
    | 'Blob'
    | 'RepositoryInvitation'
    | 'Tag';
}

export interface GetPullRequestFromGraphID_node_PullRequest_headRef_target {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFromGraphID_node_PullRequest_headRef {
  /**
   * The object the ref points to.
   */
  target: GetPullRequestFromGraphID_node_PullRequest_headRef_target;
}

export interface GetPullRequestFromGraphID_node_PullRequest {
  __typename: 'PullRequest';
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * Whether or not the pull request was merged.
   */
  merged: boolean;
  /**
   * `true` if the pull request is closed
   */
  closed: boolean;
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: GetPullRequestFromGraphID_node_PullRequest_headRef | null;
}

export type GetPullRequestFromGraphID_node =
  | GetPullRequestFromGraphID_node_CodeOfConduct
  | GetPullRequestFromGraphID_node_PullRequest;

export interface GetPullRequestFromGraphID {
  /**
   * Fetches an object given its ID.
   */
  node: GetPullRequestFromGraphID_node | null;
}

export interface GetPullRequestFromGraphIDVariables {
  id: string;
}

export const getPullRequestFromGraphId = getMethod<
  GetPullRequestFromGraphID,
  GetPullRequestFromGraphIDVariables
>(gql`
  query GetPullRequestFromGraphID($id: ID!) {
    node(id: $id) {
      __typename
      ... on PullRequest {
        databaseId
        number
        title
        merged
        closed
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
// GraphQL query operation: GetPullRequestFromNumber
// ====================================================

export interface GetPullRequestFromNumber_repository_pullRequest_headRef_target {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetPullRequestFromNumber_repository_pullRequest_headRef {
  /**
   * The object the ref points to.
   */
  target: GetPullRequestFromNumber_repository_pullRequest_headRef_target;
}

export interface GetPullRequestFromNumber_repository_pullRequest {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
  /**
   * Identifies the pull request number.
   */
  number: number;
  /**
   * Identifies the pull request title.
   */
  title: string;
  /**
   * Whether or not the pull request was merged.
   */
  merged: boolean;
  /**
   * `true` if the pull request is closed
   */
  closed: boolean;
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: GetPullRequestFromNumber_repository_pullRequest_headRef | null;
}

export interface GetPullRequestFromNumber_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetPullRequestFromNumber_repository_pullRequest | null;
}

export interface GetPullRequestFromNumber {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetPullRequestFromNumber_repository | null;
}

export interface GetPullRequestFromNumberVariables {
  owner: string;
  name: string;
  number: number;
}

export const getPullRequestFromNumber = getMethod<
  GetPullRequestFromNumber,
  GetPullRequestFromNumberVariables
>(gql`
  query GetPullRequestFromNumber(
    $owner: String!
    $name: String!
    $number: Int!
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        id
        databaseId
        number
        title
        merged
        closed
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
// GraphQL query operation: GetAllPullRequestCommits
// ====================================================

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Tree {
  __typename: 'Tree' | 'Blob' | 'Tag';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_pageInfo {
  /**
   * When paginating forwards, are there more items?
   */
  hasNextPage: boolean;
  /**
   * When paginating forwards, the cursor to continue.
   */
  endCursor: string | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents_nodes | null)[]
    | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests_nodes | null)[]
    | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes_associatedPullRequests | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history {
  /**
   * Information to aid in pagination.
   */
  pageInfo: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_pageInfo;
  /**
   * A list of nodes.
   */
  nodes:
    | (GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history_nodes | null)[]
    | null;
}

export interface GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit {
  __typename: 'Commit';
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  id: string;
  /**
   * The linear commit history starting from (and including) this commit, in the same order as `git log`.
   */
  history: GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit_history;
}

export type GetAllPullRequestCommits_repository_pullRequest_headRef_target =
  | GetAllPullRequestCommits_repository_pullRequest_headRef_target_Tree
  | GetAllPullRequestCommits_repository_pullRequest_headRef_target_Commit;

export interface GetAllPullRequestCommits_repository_pullRequest_headRef {
  /**
   * The object the ref points to.
   */
  target: GetAllPullRequestCommits_repository_pullRequest_headRef_target;
}

export interface GetAllPullRequestCommits_repository_pullRequest {
  /**
   * Identifies the head Ref associated with the pull request.
   */
  headRef: GetAllPullRequestCommits_repository_pullRequest_headRef | null;
}

export interface GetAllPullRequestCommits_repository {
  /**
   * Returns a single pull request from the current repository by number.
   */
  pullRequest: GetAllPullRequestCommits_repository_pullRequest | null;
}

export interface GetAllPullRequestCommits {
  /**
   * Lookup a given repository by the owner and repository name.
   */
  repository: GetAllPullRequestCommits_repository | null;
}

export interface GetAllPullRequestCommitsVariables {
  owner: string;
  name: string;
  number: number;
  pageSize: number;
  after?: string | null;
}

export const getAllPullRequestCommits = getMethod<
  GetAllPullRequestCommits,
  GetAllPullRequestCommitsVariables
>(gql`
  query GetAllPullRequestCommits(
    $owner: String!
    $name: String!
    $number: Int!
    $pageSize: Int!
    $after: String
  ) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        headRef {
          target {
            __typename
            oid
            ... on Commit {
              id
              history(first: $pageSize, after: $after) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  ...CommitDetail
                }
              }
            }
          }
        }
      }
    }
  }
  fragment CommitDetail on Commit {
    id
    oid
    parents(first: 100) {
      nodes {
        oid
      }
    }
    associatedPullRequests(first: 100) {
      nodes {
        id
        databaseId
      }
    }
  }
`);

// ====================================================
// GraphQL fragment: CommitDetail
// ====================================================

export interface CommitDetail_parents_nodes {
  /**
   * The Git object ID
   */
  oid: GitObjectID;
}

export interface CommitDetail_parents {
  /**
   * A list of nodes.
   */
  nodes: (CommitDetail_parents_nodes | null)[] | null;
}

export interface CommitDetail_associatedPullRequests_nodes {
  id: string;
  /**
   * Identifies the primary key from the database.
   */
  databaseId: number | null;
}

export interface CommitDetail_associatedPullRequests {
  /**
   * A list of nodes.
   */
  nodes: (CommitDetail_associatedPullRequests_nodes | null)[] | null;
}

export interface CommitDetail {
  id: string;
  /**
   * The Git object ID
   */
  oid: GitObjectID;
  /**
   * The parents of a commit.
   */
  parents: CommitDetail_parents;
  /**
   * The pull requests associated with a commit
   */
  associatedPullRequests: CommitDetail_associatedPullRequests | null;
}
