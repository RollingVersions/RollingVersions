import * as t from 'funtypes';

import withMaxLength from './withMaxLength';

const MAX_KEY_LENGTH = 32;
const MAX_DESCRIPTION_LENGTH = 64;
const MAX_TAG_FORMAT_LENGTH = 256;

export const StringKey = withMaxLength(t.String, MAX_KEY_LENGTH);
export const StringDescription = withMaxLength(
  t.String,
  MAX_DESCRIPTION_LENGTH,
);
export const TagFormatCodec = withMaxLength(t.String, MAX_TAG_FORMAT_LENGTH);
