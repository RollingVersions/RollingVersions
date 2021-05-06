import {DEFAULT_CHANGE_TYPES} from '@rollingversions/config';
import type {
  ChangeTypeID,
  ChangeType,
  ChangeSetEntry,
  ChangeSet as CS,
  MarkdownString,
} from '@rollingversions/types';

export type {ChangeSetEntry};
type ChangeSet<TContext = {}> = CS<TContext>;
export default ChangeSet;

export function createChangeSet<TContext = {}>(
  ...changes: ChangeSet<TContext>
): ChangeSet<TContext> {
  return changes;
}

export function isEmptyChangeSet(changes: ChangeSet) {
  return changes.length === 0;
}

export function mergeChangeSets<T>(
  ...sets: readonly ChangeSet<T>[]
): ChangeSet<T> {
  return sets.reduce((a, b) => [...a, ...b], []);
}

export function addContextToChangeSet<TNewContext, TOldContext = {}>(
  changeSet: ChangeSet<TOldContext>,
  newContext: TNewContext,
): ChangeSet<TOldContext & TNewContext> {
  return changeSet.map((c) => ({...c, ...newContext}));
}

export function extractChanges<TExtra>(
  changeSet: ChangeSet<TExtra>,
  changeType: ChangeTypeID,
): ChangeSet<TExtra> {
  return changeSet.filter((c) => c.type === changeType);
}

export function changesToMarkdown<TContext = {}>(
  changeSet: ChangeSet<TContext>,
  {
    changeTypes = DEFAULT_CHANGE_TYPES,
    headingLevel,
    renderContext,
  }: {
    changeTypes?: readonly ChangeType[];
    headingLevel: number;
    renderContext?: (
      changeLogEntry: ChangeSetEntry<TContext>,
    ) => MarkdownString;
  },
) {
  const headingPrefix = '#'.repeat(headingLevel);
  return changeTypes
    .map((changeType) => {
      const changes = extractChanges(changeSet, changeType.id);
      if (changes.length === 0) return '';
      return `${headingPrefix} ${changeType.plural}\n\n${changes
        .map(
          (c) =>
            `- ${c.title}${renderContext ? renderContext(c) : ``}${
              c.body.length ? `\n\n${c.body.replace(/^/gm, '  ')}` : ``
            }`,
        )
        .join('\n\n')}`;
    })
    .filter((c) => c !== '')
    .join('\n\n');
}
