import db from '@rollingversions/db';

import type {SetReleaseDescriptionBody} from '../../../types';
import type {Logger} from '../../logger';
import * as ReleaseDescriptions from '../../models/ReleaseDescriptions';
import {getRepositoryFromRestParams} from '../../models/Repositories';
import type {GitHubClient} from '../../services/github';
import type {User} from '../utils/checkPermissions';

export default async function setReleaseDescription(
  client: GitHubClient,
  user: User,
  repository: {
    owner: string;
    name: string;
  },
  body: SetReleaseDescriptionBody,
  logger: Logger,
) {
  logger.info('set_release_description', `Set release description`, {
    repo_owner: repository.owner,
    repo_name: repository.name,
    ...user,
  });

  const repo = await getRepositoryFromRestParams(db, client, {
    owner: repository.owner,
    name: repository.name,
  });
  if (!repo) return false;

  await ReleaseDescriptions.setReleaseDescription(db, repo, body);

  return true;
}
