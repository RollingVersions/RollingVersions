import PullChangeLog from './PullChangeLog';

const stateRegex = /\n\n<!-- """ChangeLogVersion State Start""" (.*) """ChangeLogVersion State End""" -->/;
export function readState(body: string): PullChangeLog | undefined {
  const match = stateRegex.exec(body);

  if (match) {
    const data = JSON.parse(match[1]);
    return data;
  }
  return undefined;
}

export function writeState(body: string, state: PullChangeLog) {
  const src = body.replace(stateRegex, '');
  return (
    src +
    `\n\n<!-- """ChangeLogVersion State Start""" ${JSON.stringify(
      state,
    )} """ChangeLogVersion State End""" -->`
  );
}
