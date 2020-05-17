import WebhooksApi from '@octokit/webhooks';
import {
  db,
  writeBranch,
  getBranch,
  upsertTag,
  getCommitFromSha,
} from '../../services/postgres';
import {GitReference, getAllRefCommits, getRef} from '../../services/github';
import {getClientForEvent} from '../../getClient';
import upsertCommits from '../procedures/upsertCommits';
import getPackageManifests from '../procedures/getPackageManifests';

export function getGitReference({
  ref_type,
  ref,
}: {
  ref_type: string;
  ref: string;
}): GitReference {
  switch (ref_type) {
    case 'branch':
      return {type: 'head', name: ref};
    case 'tag':
      return {type: 'tag', name: ref};
    default:
      throw new Error(
        `Invalid ref type "${ref_type}" for "${ref}", expected "branch" or "tag"`,
      );
  }
}
export default async function onCreate(
  e: WebhooksApi.WebhookEvent<WebhooksApi.WebhookPayloadCreate>,
) {
  const client = getClientForEvent(e);
  const ref = getGitReference(e.payload);

  const gitRepositoryId = e.payload.repository.id;
  const repo = {
    owner: e.payload.repository.owner.login,
    name: e.payload.repository.name,
  };

  const dbBranch =
    ref.type === 'head' ? await getBranch(db, gitRepositoryId, ref.name) : null;

  await upsertCommits(
    db,
    client,
    gitRepositoryId,
    repo,
    getAllRefCommits(client, repo, ref),
  );

  const gitRef = await getRef(client, repo, ref);
  if (!gitRef) {
    throw new Error(`Could not find the git ref`);
  }
  const headCommit = await getCommitFromSha(db, gitRepositoryId, gitRef.target);
  if (!headCommit) {
    throw new Error('Cannot find id for head commit');
  }
  if (ref.type === 'head') {
    await writeBranch(
      db,
      gitRepositoryId,
      {
        graphql_id: gitRef.graphql_id,
        name: gitRef.name,
        target_git_commit_id: headCommit.id,
      },
      dbBranch?.target_git_commit_id || null,
    );
    await getPackageManifests(db, client, repo, headCommit);
  } else {
    await upsertTag(db, gitRepositoryId, {
      graphql_id: gitRef.graphql_id,
      name: gitRef.name,
      target_git_commit_id: headCommit.id,
    });
  }
}
