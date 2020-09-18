import PullRequestState, {
  PullRequestStateCodec,
} from '../types/PullRequestState';

const stateRegex = /<!-- """[a-zA-Z ]+ State Start""" (.*) """[a-zA-Z ]+ State End""" -->/;
export function readState(body?: string): PullRequestState | undefined {
  if (!body) return undefined;

  const match = stateRegex.exec(body);

  if (!match) return undefined;

  // TODO: return the ValidationResult instead of throwing an error
  return PullRequestStateCodec.parse(JSON.parse(match[1]));
}

export function writeState(body: string, state: PullRequestState | undefined) {
  const src = body.replace(stateRegex, '');
  if (!state) return src;
  return (
    src +
    `\n\n<!-- """RollingVersions State Start""" ${JSON.stringify(
      PullRequestStateCodec.serialize(state),
    )
      .replace(/\>/g, '\\u003e')
      .replace(/\</g, '\\u0060')} """RollingVersions State End""" -->`
  );
}
