export type VersionValue = number & {__brand?: 'VersionValue'};
export type VersionPart = string & {__brand?: 'VersionPart'};
export type ChangeType = string & {__brand?: 'ChangeType'};
export type Markdown = string & {__brand?: 'Markdown'};

export type VersionNumber = readonly VersionValue[];

export interface ChangeLogEntryBase {
  readonly type: ChangeType;
  readonly title: Markdown;
  readonly body: Markdown;
}

export type ChangeLogEntry<TContext = {}> = ChangeLogEntryBase & TContext;

export type ChangeSet<TContext = {}> = readonly ChangeLogEntry<TContext>[];

export interface ChangeTypeConfig {
  type: ChangeType;
  versionPart: VersionPart | null;
  plural: string;
}
export interface ChangeSetConfig {
  baseVersion: readonly number[];
  versionSchema: readonly VersionPart[];
  changeTypes: readonly ChangeTypeConfig[];
}
