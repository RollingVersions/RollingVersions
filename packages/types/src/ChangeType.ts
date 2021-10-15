import * as t from 'funtypes';

import {ChangeTypeIdCodec} from './ChangeTypeID';
import {StringDescription} from './Strings';
import {VersionBumpTypeCodec} from './VersionBumpType';

export const ChangeTypeCodec = t.Readonly(
  t.Object({
    id: ChangeTypeIdCodec,
    bumps: t.Union(VersionBumpTypeCodec, t.Null),
    plural: StringDescription,
  }),
);
type ChangeType = t.Static<typeof ChangeTypeCodec>;
export default ChangeType;
