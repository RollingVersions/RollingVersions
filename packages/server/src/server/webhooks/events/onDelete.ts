import db from '@rollingversions/db';

import {getClientForEvent} from '../../getClient';
import type {Logger} from '../../logger';
import {markRepoAsUpdated, updateRepoIfChanged} from '../../models/git';
import {upsertRepositoryFromEventPayload} from '../../models/Repositories';
import {DeleteEvent} from '../event-types';

export default async function onDelete(e: DeleteEvent, logger: Logger) {
  if (e.payload.repository.owner.login === 'sitedata') return;
  const repo = await upsertRepositoryFromEventPayload(db, e.payload.repository);
  await markRepoAsUpdated(db, repo);
  const client = getClientForEvent(e);
  void updateRepoIfChanged(db, client, repo.id, logger).catch((ex) => {
    logger.error(`update_repo_failed`, ex.stack);
  });
}
