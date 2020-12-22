import {
  getDefaultBranchName,
  getRepositoryByName,
} from '@rollingversions/github';
import ServerContext from '../ServerContext';

export async function upsertRepositoryFromName(
  ctx: ServerContext,
  repository: {
    owner: string;
    name: string;
  },
) {
  const alias = await ctx.git_repository_aliases.findOne({
    owner: repository.owner.toLowerCase(),
    name: repository.name.toLowerCase(),
  });
  const repo =
    alias &&
    (await ctx.git_repositories.findOne({id: alias.git_repository_id}));
  if (repo) {
    return repo;
  }

  const ghRepo = await getRepositoryByName(ctx, {
    owner: repository.owner,
    name: repository.name,
  });
  if (!ghRepo) {
    return null;
  }
  if (!ghRepo.defaultBranchRef) {
    ctx.throw(
      'missing_default_branch',
      `Missing default branch name for ${repository.owner}/${repository.name}`,
    );
  }
  const defaultBranchName = ghRepo.defaultBranchRef.name;

  return await ctx.tx(async (ctx) => {
    const [inserted] = await ctx.git_repositories.insert({
      id: ghRepo.databaseId!,
      graphql_id: ghRepo.id,
      owner: repository.owner,
      name: repository.name,
      default_branch_name: defaultBranchName,
      is_private: ghRepo.isPrivate,
    });
    await ctx.git_repository_aliases.insertOrUpdate(['name', 'owner'], {
      git_repository_id: inserted.id,
      owner: inserted.owner.toLowerCase(),
      name: inserted.name.toLowerCase(),
    });
    return inserted;
  });
}

export async function upsertRepositoryFromEvent(
  ctx: ServerContext,
  repository: {
    id: number;
    node_id: string;
    full_name: string;
    private: boolean;
    default_branch?: string;
  },
) {
  const [owner, name] = repository.full_name.split('/');
  const repo = await ctx.git_repositories.findOne({id: repository.id});

  if (!repo) {
    const branchName =
      repository.default_branch ??
      (await getDefaultBranchName(ctx, repository.node_id));
    if (!branchName) {
      ctx.throw(
        'missing_default_branch',
        `Missing default branch name for ${repository.full_name}`,
      );
    }
    return await ctx.tx(async (ctx) => {
      const [inserted] = await ctx.git_repositories.insert({
        id: repository.id,
        graphql_id: repository.node_id,
        owner,
        name,
        default_branch_name: branchName,
        is_private: repository.private,
      });
      await ctx.git_repository_aliases.insertOrUpdate(['name', 'owner'], {
        git_repository_id: inserted.id,
        owner: inserted.owner.toLowerCase(),
        name: inserted.name.toLowerCase(),
      });
      return inserted;
    });
  }

  if (
    repo.owner !== owner ||
    repo.name !== name ||
    repo.is_private !== repository.private ||
    (repository.default_branch !== undefined &&
      repo.default_branch_name !== repository.default_branch)
  ) {
    return await ctx.tx(async (ctx) => {
      const [updated] = await ctx.git_repositories.update(
        {id: repo.id},
        {
          owner,
          name,
          is_private: repository.private,
          ...(repository.default_branch !== undefined
            ? {default_branch_name: repository.default_branch}
            : {}),
        },
      );
      if (!updated) {
        ctx.throw(
          `failed_repo_update`,
          `Failed to update ${repository.full_name}`,
        );
      }
      await ctx.git_repository_aliases.insertOrUpdate(['name', 'owner'], {
        git_repository_id: updated.id,
        owner: updated.owner.toLowerCase(),
        name: updated.name.toLowerCase(),
      });
      return updated;
    });
  }

  return repo;
}
