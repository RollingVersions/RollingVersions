import {tables, Queryable} from '@rollingversions/db';

export async function getBranch(
  git_repository_id: number,
  branchName: string,
  db?: Queryable,
) {
  return await tables.git_branches(db).findOne({
    git_repository_id: git_repository_id,
    name: branchName,
  });
}

export async function writeBranch(
  git_repository_id: number,
  branch: {graphql_id: string; name: string; target_git_commit_id: number},
  db?: Queryable,
): Promise<void> {
  const existingBranch = await getBranch(git_repository_id, branch.name, db);
  if (existingBranch) {
    await tables
      .git_branches(db)
      .update(
        {id: existingBranch.id},
        {target_git_commit_id: branch.target_git_commit_id},
      );
  } else {
    await tables.git_branches(db).insertOrUpdate(['id'], {
      git_repository_id,
      graphql_id: branch.graphql_id,
      name: branch.name,
      target_git_commit_id: branch.target_git_commit_id,
    });
  }
}

export async function deleteBranch(
  git_repository_id: number,
  branchName: string,
  db?: Queryable,
): Promise<void> {
  await tables.git_branches(db).delete({
    git_repository_id: git_repository_id,
    name: branchName,
  });
}
