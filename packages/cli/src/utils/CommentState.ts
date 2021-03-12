import type PullRequestState from '../types/PullRequestState';
import {PullRequestStateCodec} from '../types/PullRequestState';

const stateRegex = /<!-- """[a-zA-Z ]+ State Start""" (.*) """[a-zA-Z ]+ State End""" -->/;
export function readState(body?: string): PullRequestState | undefined {
  if (!body) return undefined;

  const match = stateRegex.exec(body);

  if (!match) return undefined;

  let src = match[1];

  // An old version of RollingVersion' CLI incorrectly output \u0060 in place of
  // the "<" character. This has no been fixed, but we will handle comments with
  // this mistake until most of those PRs have been released and forgotten about.
  // This hack can probably be removed after 2021-01-01
  src = src.replace(/([^\\])\\u0060/g, '$1<');

  // TODO: return the ValidationResult instead of throwing an error
  return PullRequestStateCodec.parse(JSON.parse(src));
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
      .replace(/\</g, '\\u003c')} """RollingVersions State End""" -->`
  );
}
