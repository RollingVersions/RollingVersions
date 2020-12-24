// WARNING: Pull Request state gets attatched to pull requests as a comment in GitHub.
//          There is no easy way to migrate this data, so the "Codecs" in this file
//          must support parsing all versions of this data that have ever existed.
//          Be very conservative with changes, and aim not to reference Codecs defined
//          in other files.
import {t, compressedObjectCodec} from '../utils/ValidationCodec';

export interface ChangeLogEntry {
  readonly title: string;
  readonly body: string;
}

export const ChangeLogEntryCodec: t.Codec<ChangeLogEntry> = compressedObjectCodec(
  1,
  'ChangLogEntry',
  {title: t.String, body: t.String},
  ['title', 'body'],
);

export interface ChangeSet<TExtra = {}> {
  breaking: (ChangeLogEntry & TExtra)[];
  feat: (ChangeLogEntry & TExtra)[];
  refactor: (ChangeLogEntry & TExtra)[];
  perf: (ChangeLogEntry & TExtra)[];
  fix: (ChangeLogEntry & TExtra)[];
}

export type ChangeType = keyof ChangeSet;
export const ChangeTypes = [
  'breaking',
  'feat',
  'refactor',
  'perf',
  'fix',
] as const;

export function isEmptyChangeSet(changes: ChangeSet) {
  return ChangeTypes.every((changeType) => changes[changeType].length === 0);
}
export function createEmptyChangeSet<T = {}>(): ChangeSet<T> {
  return {
    breaking: [],
    feat: [],
    refactor: [],
    perf: [],
    fix: [],
  };
}
export function mergeChangeSets<T = {}>(
  a: ChangeSet<T>,
  b: ChangeSet<T>,
): ChangeSet<T> {
  return {
    breaking: [...a.breaking, ...b.breaking],
    feat: [...a.feat, ...b.feat],
    refactor: [...a.refactor, ...b.refactor],
    perf: [...a.perf, ...b.perf],
    fix: [...a.fix, ...b.fix],
  };
}
export function changeSetWithContext<TNewContext, TOldContext = {}>(
  changes: ChangeSet<TOldContext>,
  context: TNewContext,
): ChangeSet<TOldContext & TNewContext> {
  return {
    breaking: changes.breaking.map((c) => ({...c, ...context})),
    feat: changes.feat.map((c) => ({...c, ...context})),
    refactor: changes.refactor.map((c) => ({...c, ...context})),
    perf: changes.perf.map((c) => ({...c, ...context})),
    fix: changes.fix.map((c) => ({...c, ...context})),
  };
}

export const ChangeSetCodec: t.Codec<ChangeSet> = compressedObjectCodec(
  1,
  'ChangeSet',
  {
    breaking: t.Array(ChangeLogEntryCodec),
    feat: t.Array(ChangeLogEntryCodec),
    refactor: t.Array(ChangeLogEntryCodec),
    perf: t.Array(ChangeLogEntryCodec),
    fix: t.Array(ChangeLogEntryCodec),
  },
  ['breaking', 'feat', 'refactor', 'perf', 'fix'],
);
