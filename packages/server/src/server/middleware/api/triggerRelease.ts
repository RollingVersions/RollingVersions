import assertNever from 'assert-never';
import fetch from 'cross-fetch';

import {Queryable} from '@rollingversions/db';

import {getTokenForRepo} from '../../getClient';
import type {Logger} from '../../logger';
import {getRollingVersionsConfigForBranch} from '../../models/PackageManifests';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';

export default async function triggerRelease(
  db: Queryable,
  client: GitHubClient,
  params: {
    owner: string;
    repo: string;
    branch?: string;
    authToken: string;
  },
  logger: Logger,
) {
  const dbRepo = await getRepositoryFromRestParams(db, client, {
    owner: params.owner,
    name: params.repo,
  });
  if (!dbRepo) {
    return null;
  }
  const config = await getRollingVersionsConfigForBranch(
    db,
    client,
    dbRepo,
    {type: 'branch', name: params.branch ?? dbRepo.default_branch_name},
    logger,
  );
  if (!config?.ok) {
    return null;
  }
  if (config.value === null) {
    await client.rest.repos.createDispatchEvent({
      owner: dbRepo.owner,
      repo: dbRepo.name,
      event_type: 'rollingversions_publish_approved',
    });
    return `https://github.com/${dbRepo.owner}/${dbRepo.name}/actions?query=event%3Arepository_dispatch`;
  }
  const trigger = config.value.release_trigger;
  if (!trigger) {
    return null;
  }
  switch (trigger.type) {
    case 'github_workflow_trigger':
      const response = await fetch(
        `https://api.github.com/repos/${dbRepo.owner}/${
          dbRepo.name
        }/actions/workflows/${encodeURIComponent(trigger.name)}.yml/dispatches`,
        {
          method: `POST`,
          headers: {
            Authorization: `token ${await getTokenForRepo({
              owner: dbRepo.owner,
              name: dbRepo.name,
            })}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: params.branch ?? dbRepo.default_branch_name,
            inputs: {},
          }),
        },
      );
      if (!response.ok) {
        throw new Error(await response.text());
      }

      logger.info(
        `repository_dispatch`,
        `Dispatched repository event: ${await response.text()}`,
      );
      return `https://github.com/${dbRepo.owner}/${
        dbRepo.name
      }/actions/workflows/${encodeURIComponent(
        trigger.name,
      )}.yml?query=${encodeURIComponent(
        `branch:${params.branch ?? dbRepo.default_branch_name}`,
      )}`;
    default:
      return assertNever(trigger.type);
  }
}
