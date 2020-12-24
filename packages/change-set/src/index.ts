import {
  ChangeLogEntry,
  ChangeSet,
  ChangeSetConfig,
  ChangeType,
  ChangeTypeConfig,
  Markdown,
  VersionNumber,
  VersionPart,
  VersionValue,
} from './types';

export type {
  ChangeLogEntry,
  ChangeSet,
  ChangeSetConfig,
  ChangeType,
  ChangeTypeConfig,
  Markdown,
  VersionNumber,
  VersionPart,
  VersionValue,
};

function ct(
  type: ChangeType,
  versionPart: VersionPart,
  plural: string,
): ChangeTypeConfig {
  return {type, versionPart, plural};
}
export const DefaultChangeSetConfig = validateChangeSetConfig({
  baseVersion: [1, 0, 0],
  versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
  changeTypes: [
    ct('breaking', 'MAJOR', 'Breaking Changes'),
    ct('feat', 'MINOR', 'New Features'),
    ct('refactor', 'MINOR', 'Refactors'),
    ct('perf', 'PATCH', 'Performance Improvements'),
    ct('fix', 'PATCH', 'Bug Fixes'),
  ],
});

export function validateChangeSetConfig(
  config: ChangeSetConfig,
): ChangeSetConfig {
  if (config.baseVersion.length !== config.versionSchema.length) {
    throw new Error(
      'The baseVersion must be the same length as the versionSchema',
    );
  }

  if (
    config.versionSchema.some(
      (part, i) => config.versionSchema.indexOf(part) !== i,
    )
  ) {
    throw new Error('You have duplicate part names in the version schema');
  }

  if (
    config.changeTypes.some(
      (c) =>
        c.versionPart !== null && !config.versionSchema.includes(c.versionPart),
    )
  ) {
    throw new Error(
      'You have a change type that referes to a version part that does not exist in your version schema',
    );
  }

  return config;
}

export function mergeChangeSets<T>(
  a: ChangeSet<T>,
  b: ChangeSet<T>,
): ChangeSet<T> {
  return [...a, ...b];
}

export function addContextToChangeSet<TNewContext, TOldContext = {}>(
  changeSet: ChangeSet<TOldContext>,
  newContext: TNewContext,
): ChangeSet<TOldContext & TNewContext> {
  return changeSet.map((c) => ({...c, ...newContext}));
}

export function extractChanges<TExtra>(
  changeSet: ChangeSet<TExtra>,
  changeType: ChangeType,
): ChangeSet<TExtra> {
  return changeSet.filter((c) => c.type === changeType);
}

function getNextVersionBumpIndex(
  changeSet: ChangeSet,
  config: ChangeSetConfig,
) {
  const changeTypes = new Set(changeSet.map((c) => c.type));
  const versionParts = new Set(
    [...changeTypes].map(
      (t) => config.changeTypes.find((c) => c.type === t)?.versionPart,
    ),
  );
  return config.versionSchema.findIndex((versionPart) =>
    versionParts.has(versionPart),
  );
}

function inc(value: VersionValue): VersionValue {
  const v: number = value;
  return v + 1;
}

export function gt(a: VersionNumber, b: VersionNumber) {
  for (let i = 0; i < a.length; i++) {
    if (i < b.length) {
      if (a[i] > b[i]) {
        return true;
      }
      if (a[i] < b[i]) {
        return false;
      }
    } else {
      if (a[i] > 0) {
        return true;
      }
    }
  }
  return false;
}

export function lt(a: VersionNumber, b: VersionNumber) {
  for (let i = 0; i < b.length; i++) {
    if (i < a.length) {
      if (a[i] < b[i]) {
        return true;
      }
      if (a[i] > b[i]) {
        return false;
      }
    } else {
      if (b[i] > 0) {
        return true;
      }
    }
  }
  return false;
}

export function getNextVersion(
  currentVersion: null | VersionNumber,
  changeSet: ChangeSet,
  config: ChangeSetConfig,
): null | VersionNumber {
  const bumpIndex = getNextVersionBumpIndex(changeSet, config);
  if (bumpIndex === -1) return null;

  if (currentVersion === null) return config.baseVersion;

  // if the length of the version number has increased, we pad out the ending
  // if the length of the version number has decreased, we drop excess from the ending
  // this means we always preserve the most significant version numbers.
  const normalizedCurrentVersion = config.versionSchema.map(
    (_, i): VersionValue => (i < currentVersion.length ? currentVersion[i] : 0),
  );

  if (lt(normalizedCurrentVersion, config.baseVersion)) {
    return config.baseVersion;
  }

  return normalizedCurrentVersion.map(
    (value, index): VersionValue =>
      index === bumpIndex ? inc(value) : index > bumpIndex ? 0 : value,
  );
}

export function changesToMarkdown<TContext = {}>(
  changeSet: ChangeSet<TContext>,
  {
    changeTypes,
    headingLevel,
    renderContext,
  }: {
    changeTypes: readonly ChangeTypeConfig[];
    headingLevel: number;
    renderContext?: (changeLogEntry: ChangeLogEntry<TContext>) => Markdown;
  },
) {
  const headingPrefix = '#'.repeat(headingLevel);
  return changeTypes
    .map((changeType) => {
      const changes = extractChanges(changeSet, changeType.type);
      if (changes.length === 0) return '';
      return `${headingPrefix} ${changeType.plural}\n\n${changes
        .map(
          (c) =>
            `- ${c.title}${renderContext ? renderContext(c) : ``}${
              c.body ? `\n\n${c.body.replace(/^/gm, '  ')}` : ``
            }`,
        )
        .join('\n\n')}`;
    })
    .filter((c) => c !== '')
    .join('\n\n');
}
