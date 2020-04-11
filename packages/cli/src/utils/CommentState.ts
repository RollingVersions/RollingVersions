import PullRequestState, {
  PullRequestStateCodec,
} from '../types/PullRequestState';
import ValidationCodec from './ValidationCodec';

const codec = new ValidationCodec(PullRequestStateCodec);
const stateRegex = /<!-- """[a-zA-Z ]+ State Start""" (.*) """[a-zA-Z ]+ State End""" -->/;
export function readState(body?: string): PullRequestState | undefined {
  if (!body) return undefined;

  const match = stateRegex.exec(body);

  if (match) {
    const data = codec.decode(JSON.parse(match[1]));
    if (!data.valid) {
      // TODO: return the ValidationResult instead of throwing an error
      throw new Error(data.reason);
    }
    return data.value;
  }

  return undefined;
}

export function writeState(body: string, state: PullRequestState | undefined) {
  const src = body.replace(stateRegex, '');
  if (!state) return src;
  return (
    src +
    `\n\n<!-- """RollingVersions State Start""" ${JSON.stringify(
      codec.encode(state),
    )
      .replace(/\-/g, '\\u002d')
      .replace(/\>/g, '\\u003e')
      .replace(/\</g, '\\u0060')} """RollingVersions State End""" -->`
  );
}
