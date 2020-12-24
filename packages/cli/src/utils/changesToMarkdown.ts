import {ChangeSet} from '../types';
import {ChangeTypes} from '../types/ChangeSet';

export default function changesToMarkdown(
  changes: ChangeSet<{readonly pr?: number}>,
  headingLevel: number,
) {
  const headingPrefix = '#'.repeat(headingLevel);
  return ChangeTypes.filter((changeType) => changes[changeType].length)
    .map(
      (changeType) =>
        `${headingPrefix} ${
          {
            breaking: 'Breaking Changes',
            feat: 'New Features',
            refactor: 'Refactorings',
            perf: 'Performance Improvements',
            fix: 'Bug Fixes',
          }[changeType]
        }\n\n${changes[changeType]
          .map(
            (c) =>
              `- ${c.title}${c.pr ? ` (#${c.pr})` : ``}${
                c.body ? `\n\n${c.body.replace(/^/gm, '  ')}` : ``
              }`,
          )
          .join('\n\n')}`,
    )
    .join('\n\n');
}
