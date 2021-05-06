import ChangeTypeID from './ChangeTypeID';
import MarkdownString from './MarkdownString';

export interface ChangeSetEntryBase {
  readonly type: ChangeTypeID;
  readonly title: MarkdownString;
  readonly body: MarkdownString;
}

export type ChangeSetEntry<TContext = {}> = ChangeSetEntryBase & TContext;

type ChangeSet<TContext = {}> = readonly ChangeSetEntry<TContext>[];
export default ChangeSet;
