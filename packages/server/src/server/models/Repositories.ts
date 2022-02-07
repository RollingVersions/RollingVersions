import * as ft from 'funtypes';

import type {Queryable} from '@rollingversions/db';
import {tables} from '@rollingversions/db';

import type {GitHubClient} from '../services/github';
import {getRepository} from '../services/github';

/**
 * Repository from a webhook event
 */
export interface PayloadRepository {
  id: number;
  node_id: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}
const PayloadRepositorySchema: ft.Runtype<PayloadRepository> = ft.Object({
  id: ft.Number,
  node_id: ft.String,
  full_name: ft.String.withConstraint((value) =>
    /^[^\/]+\/[^\/]+$/.test(value)
      ? true
      : `Expected full_name to be in the form "owner/name" but got "${value}"`,
  ),
  private: ft.Boolean,
  default_branch: ft.String,
});

/**
 * Repository for a REST API call
 */
export interface RestParameterRepository {
  owner: string;
  name: string;
}
const RestParameterRepositorySchema: ft.Runtype<RestParameterRepository> = ft.Object(
  {
    owner: ft.String,
    name: ft.String,
  },
);

export async function getRepositoryFromRestParams(
  db: Queryable,
  client: GitHubClient,
  repo: RestParameterRepository,
) {
  RestParameterRepositorySchema.parse(repo);

  const existingRepo = await tables.git_repositories(db).findOne({
    owner: repo.owner,
    name: repo.name,
    uninstalled_at: null,
  });
  if (existingRepo) return existingRepo;

  const graphRepo = await getRepository(client, {
    owner: repo.owner,
    name: repo.name,
  });
  if (!graphRepo?.defaultBranch) {
    return null;
  }
  const [dbRepo] = await tables.git_repositories(db).insertOrUpdate([`id`], {
    id: graphRepo.id,
    graphql_id: graphRepo.graphql_id,
    owner: repo.owner,
    name: repo.name,
    default_branch_name: graphRepo.defaultBranch,
    uninstalled_at: null,
  });
  return dbRepo;
}

export async function uninstallRepository(
  db: Queryable,
  repo: RestParameterRepository,
) {
  await tables
    .git_repositories(db)
    .update(
      {owner: repo.owner, name: repo.name, uninstalled_at: null},
      {uninstalled_at: new Date()},
    );
}

export async function upsertRepositoryFromEventPayload(
  db: Queryable,
  repo: PayloadRepository,
) {
  PayloadRepositorySchema.parse(repo);
  const [owner, name] = repo.full_name.split(`/`);
  const [dbRepo] = await tables.git_repositories(db).insertOrUpdate([`id`], {
    id: repo.id,
    graphql_id: repo.node_id,
    owner,
    name,
    default_branch_name: repo.default_branch,
    uninstalled_at: null,
  });
  return dbRepo;
}
