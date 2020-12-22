import IsolationLevel from '@databases/pg/lib/types/IsolationLevel';
import DbPullRequest from '@rollingversions/db/pull_requests';
import {ChangeLogEntries_InsertParameters} from '@rollingversions/db/change_log_entries';
import {ChangeType} from 'rollingversions/src/types/PullRequestState';
import ServerContext, {NonTransactionContext} from '../ServerContext';

export async function getChangesForPullRequest(
  ctx: ServerContext,
  pull_request_id: DbPullRequest['id'],
): Promise<
  {
    id: number;
    package_name: string;
    sort_order_weight: number;
    kind: ChangeType;
    title: string;
    body: string;
  }[]
> {
  return ctx.change_log_entries
    .find({pull_request_id})
    .orderByAsc('sort_order_weight')
    .orderByAsc('id')
    .all();
}

export async function updateChangeLogEntries(
  ctx: NonTransactionContext,
  pull_request_id: DbPullRequest['id'],
  changeLogEntries: Omit<
    ChangeLogEntries_InsertParameters,
    'pull_request_id'
  >[],
) {
  await ctx.tx(
    async (ctx) => {
      await ctx.change_log_entries.delete({pull_request_id});
      await ctx.change_log_entries.insert(
        ...changeLogEntries.map((c) => ({...c, pull_request_id})),
      );
    },
    {
      isolationLevel: IsolationLevel.SERIALIZABLE,
      retrySerializationFailures: true,
    },
  );
}
