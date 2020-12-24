export type VersionValue = number & {__brand?: 'VersionValue'};
export type VersionPart = string & {__brand?: 'VersionPart'};
export type ChangeType = string & {__brand?: 'ChangeType'};
export type Markdown = string & {__brand?: 'Markdown'};

export type VersionNumber = readonly VersionValue[];

export interface ChangeSetEntryBase {
  readonly type: ChangeType;
  readonly title: Markdown;
  readonly body: Markdown;
}

export type ChangeSetEntry<TContext = {}> = ChangeSetEntryBase & TContext;

export type ChangeSet<TContext = {}> = readonly ChangeSetEntry<TContext>[];

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
