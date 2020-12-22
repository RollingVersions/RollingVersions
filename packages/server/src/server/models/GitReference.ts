import assertNever from 'assert-never';
import DbGitRepository from '@rollingversions/db/git_repositories';
import DbGitTag, {GitTags_InsertParameters} from '@rollingversions/db/git_tags';
import {
  getRefByQualifiedName,
  getRefs,
  resolveTargetCommit,
} from '@rollingversions/github';
import ServerContext from '../ServerContext';
import {upsertCommit} from './Commits';
import debounceByKey from '../../utils/debounceByKey';
import dedupeByKey from '../../utils/dedupeByKey';

// We periodically refresh all tags in case we miss a webhook event.
// If the tags are fairly up to date, we will do this refresh in the
// background. If it has been a long time, we may make the user/request
// wait until they have been refreshed.

// mimimum time in ms between refreshing tags for a repository
const MIN_STALE_TAGS = 10 * 60_000; // 10 minutes
// maximum time in ms between refreshing tags for a repository
const MAX_STALE_TAGS = 24 * 60 * 60_000; // 24 hours

/**
 * The payload of a GitHub webhook for a ref being
 * created/updated is not type-safe, and needs to
 * be resolved into the full ResolvedRef spec.
 */
export interface EventRef {
  ref: string;
  ref_type: string;
}

export interface ResolvedRef {
  type: 'branch' | 'tag';
  name: string;
  qualifiedName: string;
}

const BRANCH_PREFIX = `refs/heads/`;
const TAG_PREFIX = `refs/tags/`;
export function resolveReferenceFromEventPayload({
  ref,
  ref_type,
}: EventRef): ResolvedRef | null {
  switch (ref_type) {
    case 'branch':
      return {
        type: 'branch',
        name: ref,
        qualifiedName: `${BRANCH_PREFIX}${ref}`,
      };
    case 'tag':
      return {type: 'tag', name: ref, qualifiedName: `${TAG_PREFIX}${ref}`};
    default:
      return null;
  }
}
export function resolveReferenceFromString(
  qualifiedName: string,
): ResolvedRef | null {
  if (qualifiedName.startsWith(BRANCH_PREFIX)) {
    return {
      type: 'branch',
      name: qualifiedName.substr(BRANCH_PREFIX.length),
      qualifiedName,
    };
  }
  if (qualifiedName.startsWith(TAG_PREFIX)) {
    return {
      type: 'tag',
      name: qualifiedName.substr(TAG_PREFIX.length),
      qualifiedName,
    };
  }
  return null;
}

const debounceGitReferenceUpdate = debounceByKey<
  ResolvedRef['qualifiedName'],
  void
>();
export async function updateGitReference(
  ctx: ServerContext,
  repo: DbGitRepository,
  ref: ResolvedRef,
) {
  await debounceGitReferenceUpdate(ref.qualifiedName, async () => {
    const ghRef = await getRefByQualifiedName(ctx, {
      repoID: repo.graphql_id,
      qualifiedName: ref.qualifiedName,
    });

    if (!ghRef) {
      ctx.throw(
        `missing_ref`,
        `Could not find the git ref "${ref.qualifiedName}" in ${repo.owner}/${repo.name}`,
        {qualified_name: ref.qualifiedName},
      );
    }

    const target = resolveTargetCommit(ghRef.target);
    if (!target) {
      ctx.throw(
        `missing_ref_target`,
        `Could not resolve the target for git ref "${ref.qualifiedName}" in ${repo.owner}/${repo.name}`,
        {qualified_name: ref.qualifiedName},
      );
    }

    const headCommit = await upsertCommit(ctx, {
      commit_sha: target.oid,
      git_repository_id: repo.id,
      graphql_id: target.id,
    });

    if (ref.type === 'branch') {
      await ctx.git_branches.insertOrUpdate(['git_repository_id', 'name'], {
        git_repository_id: repo.id,
        graphql_id: ghRef.id,
        name: ghRef.name,
        target_git_commit_id: headCommit.id,
      });
    } else if (ref.type === 'tag') {
      await ctx.git_tags.insertOrUpdate(['git_repository_id', 'name'], {
        git_repository_id: repo.id,
        graphql_id: ghRef.id,
        name: ghRef.name,
        target_git_commit_id: headCommit.id,
      });
    } else {
      assertNever(ref.type);
    }
  });
}

export async function deleteGitReference(
  ctx: ServerContext,
  git_repository_id: DbGitRepository['id'],
  ref: ResolvedRef,
): Promise<void> {
  await debounceGitReferenceUpdate(ref.qualifiedName, async () => {
    switch (ref.type) {
      case 'branch':
        await ctx.git_branches.delete({git_repository_id, name: ref.name});
        break;
      case 'tag':
        await ctx.git_tags.delete({git_repository_id, name: ref.name});
        break;
      default:
        assertNever(ref.type);
        break;
    }
  });
}

export async function getBranch(
  ctx: ServerContext,
  repo: DbGitRepository,
  branchName: string,
) {
  const branch = await ctx.git_branches.findOne({
    git_repository_id: repo.id,
    name: branchName,
  });
  if (branch) {
    // TODO: check for updates occasionally
    return branch;
  }

  const ghRef = await getRefByQualifiedName(ctx, {
    repoID: repo.graphql_id,
    qualifiedName: `refs/heads/${branchName}`,
  });
  if (!ghRef) {
    return null;
  }

  const target = resolveTargetCommit(ghRef.target);
  if (!target) {
    ctx.throw(
      `missing_ref_target`,
      `Could not resolve the target for git ref "refs/heads/${branchName}" in ${repo.owner}/${repo.name}`,
      {qualified_name: `refs/heads/${branchName}`},
    );
  }

  const headCommit = await upsertCommit(ctx, {
    commit_sha: target.oid,
    git_repository_id: repo.id,
    graphql_id: target.id,
  });

  const [updated] = await ctx.git_branches.insertOrUpdate(
    ['git_repository_id', 'name'],
    {
      git_repository_id: repo.id,
      graphql_id: ghRef.id,
      name: ghRef.name,
      target_git_commit_id: headCommit.id,
    },
  );
  return updated;
}

export async function getTags(ctx: ServerContext, repo: DbGitRepository) {
  if (
    repo.tags_refreshed_at &&
    Date.now() - repo.tags_refreshed_at.getTime() < MIN_STALE_TAGS
  ) {
    return await ctx.git_tags.find({git_repository_id: repo.id}).all();
  }

  if (
    repo.tags_refreshed_at &&
    Date.now() - repo.tags_refreshed_at.getTime() < MAX_STALE_TAGS
  ) {
    // we will return the current tags, but we will also refresh the tags in
    // the background in case they are out of date
    void refreshRepositoryTags(ctx, repo).catch((ex) => {
      ctx.error(`error_loading_tags`, `${ex.stack || ex.message || ex}`);
    });
    return await ctx.git_tags.find({git_repository_id: repo.id}).all();
  }

  return await refreshRepositoryTags(ctx, repo);
}

const dedupeRefreshTags = dedupeByKey<DbGitRepository['id'], DbGitTag[]>();
async function refreshRepositoryTags(
  ctx: ServerContext,
  repo: DbGitRepository,
) {
  return dedupeRefreshTags(repo.id, async () => {
    let page = await getRefs(ctx, {
      repoID: repo.graphql_id,
      refPrefix: TAG_PREFIX,
    });
    while (page) {
      const tagsToInsert = await Promise.all(
        (page.nodes ?? []).map(
          async (ghRef): Promise<GitTags_InsertParameters | null> => {
            if (!ghRef) return null;

            const target = resolveTargetCommit(ghRef.target);
            if (!target) {
              ctx.throw(
                `missing_ref_target`,
                `Could not resolve the target for git ref "${TAG_PREFIX}${ghRef.name}" in ${repo.owner}/${repo.name}`,
                {qualified_name: `${TAG_PREFIX}${ghRef.name}`},
              );
            }

            const headCommit = await upsertCommit(ctx, {
              commit_sha: target.oid,
              git_repository_id: repo.id,
              graphql_id: target.id,
            });

            return {
              git_repository_id: repo.id,
              graphql_id: ghRef.id,
              name: ghRef.name,
              target_git_commit_id: headCommit.id,
            };
          },
        ),
      );
      await ctx.tx(async (ctx) => {
        await Promise.all(
          tagsToInsert.map(
            (t) =>
              t &&
              ctx.git_tags.insertOrUpdate(['git_repository_id', 'name'], t),
          ),
        );
      });
      page = page.pageInfo.hasNextPage
        ? await getRefs(ctx, {
            repoID: repo.graphql_id,
            refPrefix: TAG_PREFIX,
            after: page.pageInfo.endCursor,
          })
        : null;
    }
    await ctx.git_repositories.update(
      {id: repo.id},
      {tags_refreshed_at: new Date()},
    );
    return ctx.git_tags.find({git_repository_id: repo.id}).all();
  });
}
