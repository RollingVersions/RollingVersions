import * as t from 'funtypes';

import {StringKey} from './Strings';

type VersionBumpType = string & {__brand?: 'VersionBumpType'};
export default VersionBumpType;

export const VersionBumpTypeCodec = StringKey as t.Codec<VersionBumpType>;
