import {PullRequest, ChangeSet} from 'rollingversions/lib/types';
import {PullRequestPackage} from '../../../types';

import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';
import {NonTransactionContext} from '../../ServerContext';
import {upsertRepositoryFromName} from '../../models/Repository';
import {
  getPullRequestByID,
  onChangeLogUpdated,
  upsertPullRequestByNumber,
} from '../../models/PullRequests';
import getPullRequestPackages from './getPullRequestPackages';
import {updateChangeLogEntries} from '../../models/ChangeLogEntry';

export default async function writePullRequestState(
  ctx: NonTransactionContext,
  pullRequest: Pick<PullRequest, 'repo' | 'number'>,
  headShaForChanges: string | null,
  changes: {packageName: string; changes: ChangeSet}[],
) {
  const repo = await upsertRepositoryFromName(ctx, pullRequest.repo);
  if (!repo) return null;

  const pr = await upsertPullRequestByNumber(ctx, repo, pullRequest.number);
  if (!pr) return null;

  const changesByPackage = new Map(
    changes.map((c) => [c.packageName, c.changes]),
  );
  const packages = new Map(
    [...(await getPullRequestPackages(ctx, repo, pr))].map(
      ([packageName, metadata]): [string, PullRequestPackage] => [
        packageName,
        metadata.released
          ? metadata
          : {
              ...metadata,
              changeSet:
                changesByPackage.get(packageName) || metadata.changeSet,
            },
      ],
    ),
  );

  await updateChangeLogEntries(
    ctx,
    pr.id,
    [...packages]
      .flatMap(([package_name, {changeSet}]) =>
        ChangeTypes.flatMap((kind) =>
          changeSet[kind].map((changeLogEntry) => ({
            package_name,
            kind,
            title: changeLogEntry.title,
            body: changeLogEntry.body,
          })),
        ),
      )
      .map((cle, sort_order_weight) => ({...cle, sort_order_weight})),
  );

  await onChangeLogUpdated(ctx, repo, pr.id, headShaForChanges);

  return await getPullRequestByID(ctx, pr.id);
}
