export type ChangeTypeID = string & {__brand?: 'ChangeTypeID'};
export type Markdown = string & {__brand?: 'Markdown'};

export interface ChangeSetEntryBase {
  readonly type: ChangeTypeID;
  readonly title: Markdown;
  readonly body: Markdown;
}

export type ChangeSetEntry<TContext = {}> = ChangeSetEntryBase & TContext;

export interface ChangeType {
  readonly id: ChangeTypeID;
  readonly plural: string;
}
