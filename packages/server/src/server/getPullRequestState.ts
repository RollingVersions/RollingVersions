import {
  PullRequest,
  ChangeSet,
  PackageInfo,
  PullRequestState,
} from 'rollingversions/lib/types';
import {
  GitHubClient,
  getPullRequestHeadSha,
  getPullRequestStatus,
  readComments,
  getAllTags,
  getAllFiles,
  writeComment,
  updateStatus,
  deleteComment,
} from 'rollingversions/lib/services/github';
import {readState} from 'rollingversions/lib/utils/CommentState';
import listPackages from 'rollingversions/lib/utils/listPackages';
import {
  COMMENT_GUID,
  renderInitialComment,
  getUrlForChangeLog,
} from 'rollingversions/lib/utils/Rendering';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';
import {APP_URL} from './environment';
import log from './logger';

async function getCommentState(
  client: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  closedPromise: Promise<{closed: boolean} | undefined>,
  headShaPromise: string | Promise<string | undefined>,
) {
  for await (const comment of readComments(client, pullRequest)) {
    if (comment.body.includes(COMMENT_GUID)) {
      const state = readState(comment.body) || null;
      return {state, commentID: comment.commentID};
    }
  }
  const [{closed = false} = {}, headSha] = await Promise.all([
    closedPromise,
    headShaPromise,
  ] as const);
  if (!closed && headSha) {
    // If there is no status, we write an initial status as quickly as possible
    // without waiting until we've extracted all the package versions.

    // This improves percieved responsiveness and reduces the chance of use accidentally writing
    // two comments instead of one.

    // Just in case, we then check immediately for duplicates and remove them.
    const commentID = await writeComment(
      client,
      pullRequest,
      renderInitialComment(pullRequest, APP_URL),
      undefined,
    );
    await updateStatus(
      client,
      {...pullRequest, headSha},
      {
        state: 'pending',
        url: getUrlForChangeLog(pullRequest, APP_URL),
        description: '',
      },
    );

    let seenFirstComment = false;
    for await (const comment of readComments(client, pullRequest, {
      pageSize: 50,
    })) {
      if (comment.body.includes(COMMENT_GUID)) {
        if (!seenFirstComment) {
          seenFirstComment = true;
        } else {
          // we have a duplicate comment
          log({
            event_status: 'warn',
            event_type: 'deleting_duplicate_comment',
            message: `Deleting duplicate comment`,
            repo_owner: pullRequest.repo.owner,
            repo_name: pullRequest.repo.name,
            pull_number: pullRequest.number,
          });
          deleteComment(client, pullRequest, comment.commentID).then(
            () => {
              log({
                event_status: 'warn',
                event_type: 'deleted_duplicate_comment',
                message: `Deleted duplicate comment`,
                repo_owner: pullRequest.repo.owner,
                repo_name: pullRequest.repo.name,
                pull_number: pullRequest.number,
              });
            },
            (ex) => {
              log({
                event_status: 'error',
                event_type: 'delete_comment_failed',
                message: `Unable to delete comment:\n\n${ex.stack ||
                  ex.message ||
                  ex}`,
                repo_owner: pullRequest.repo.owner,
                repo_name: pullRequest.repo.name,
                pull_number: pullRequest.number,
              });
            },
          );
        }
      }
    }

    return {state: null, commentID};
  }
  return {state: null, commentID: null};
}

function updatePackages(
  oldPackages:
    | Map<
        string,
        {
          changes: ChangeSet;
          info: PackageInfo[];
        }
      >
    | undefined,
  packageInfos: Map<string, PackageInfo[]>,
) {
  const packages = new Map<
    string,
    {
      changes: ChangeSet;
      info: PackageInfo[];
    }
  >(
    [...packageInfos].map(([packageName, info]) => [
      packageName,
      {
        changes: getEmptyChangeSet(),
        info,
      },
    ]),
  );
  for (const [packageName, {changes}] of oldPackages || []) {
    packages.set(packageName, {
      changes,
      info: packages.get(packageName)?.info || [],
    });
  }
  return packages;
}
export default async function getPullRequestState(
  client: GitHubClient,
  pullRequest: Pick<PullRequest, 'repo' | 'number'> &
    Partial<Pick<PullRequest, 'headSha'>>,
): Promise<{
  state: PullRequestState | null;
  commentID: number | null;
  closed: boolean;
  merged: boolean;
  updateRequired: boolean;
}> {
  const headShaPromise =
    pullRequest.headSha || getPullRequestHeadSha(client, pullRequest);
  const closedAndMergedPromise = getPullRequestStatus(client, pullRequest);
  const [
    headSha,
    {closed, merged} = {closed: false, merged: false},
    {state, commentID},
  ] = await Promise.all([
    headShaPromise,
    closedAndMergedPromise,
    getCommentState(
      client,
      pullRequest,
      closedAndMergedPromise,
      headShaPromise,
    ),
  ] as const);
  if (state && (state.packageInfoFetchedAt === headSha || !headSha)) {
    if (merged) {
      const packageInfos = await listPackages(
        getAllTags(client, pullRequest.repo),
        getAllFiles(client, pullRequest.repo),
      );
      const packages = updatePackages(state.packages, packageInfos);
      return {
        state: {...state, packages},
        commentID,
        closed,
        merged,
        updateRequired: false,
      };
    }
    return {state, commentID, closed, merged, updateRequired: false};
  } else if (headSha) {
    const packageInfos = await listPackages(
      getAllTags(client, pullRequest.repo),
      getAllFiles(client, merged ? pullRequest.repo : pullRequest),
    );
    const packages = updatePackages(state?.packages, packageInfos);
    return {
      commentID,
      state: {
        submittedAtCommitSha: state?.submittedAtCommitSha || null,
        packageInfoFetchedAt: headSha,
        packages,
      },
      closed,
      merged,
      updateRequired: true,
    };
  } else {
    return {
      commentID: null,
      state: null,
      closed,
      merged,
      updateRequired: false,
    };
  }
}
