import * as t from 'funtypes';

import {StringKey} from './Strings';
import VersionBumpType from './VersionBumpType';
import withMaxLength from './withMaxLength';

const MAX_VERSION_SCHEMA_LENGTH = 16;

type VersionSchema = readonly [
  VersionBumpType,
  ...(readonly VersionBumpType[])
];
export default VersionSchema;

export const VersionSchemaCodec: t.Codec<VersionSchema> = withMaxLength(
  t.ReadonlyArray(StringKey),
  MAX_VERSION_SCHEMA_LENGTH,
).withGuard(
  <T>(x: readonly T[]): x is readonly [T, ...(readonly T[])] => x.length !== 0,
  {name: 'VersionSchema'},
);
