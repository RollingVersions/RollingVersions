import * as t from 'funtypes';

export const BaseVersionCodec = t.Readonly(
  t.Array(
    t.Number.withConstraint((v) =>
      v !== Math.floor(v)
        ? 'Version parts must be whole numbers'
        : v < 0
        ? 'Version parts cannot be less than 0'
        : v > Number.MAX_SAFE_INTEGER
        ? 'Version parts must be less than MAX_SAFE_INTEGER'
        : true,
    ),
  ),
);

type BaseVersion = t.Static<typeof BaseVersionCodec>;
export default BaseVersion;
