import {URL} from 'url';
import PullChangeLog, {
  ChangeLogEntry,
  ChangeTypes,
  SectionTitle,
} from './PullChangeLog';

export function changesToMarkdown(
  changes: (ChangeLogEntry & {pr?: number})[],
  headingLevel: number,
) {
  const headingPrefix = '#'.repeat(headingLevel);
  return ChangeTypes.filter((ct) => changes.some((c) => c.type === ct))
    .map(
      (ct) =>
        `${headingPrefix} ${SectionTitle[ct]}\n\n${changes
          .filter((c) => c.type === ct)
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

export function renderComment(
  pullRequest: {
    latestCommitSha: string;
    owner: string;
    repo: string;
    pr: number;
  },
  changeLog: PullChangeLog | undefined,
  changeLogVersionURL: URL,
) {
  const url = new URL(
    `/${pullRequest.owner}/${pullRequest.repo}/${pullRequest.pr}`,
    changeLogVersionURL,
  );
  if (!changeLog || !changeLog.submittedAtCommitSha) {
    return `There is no change log for this pull request yet.\n\n[Create a changelog](${url})`;
  }
}
export function renderReleaseNotes(
  changes: (ChangeLogEntry & {pr?: number})[],
) {
  return changesToMarkdown(changes, 2);
}
