import * as t from 'funtypes';

import {StringKey} from './Strings';

type ChangeTypeID = string & {__brand?: 'ChangeTypeID'};
export default ChangeTypeID;

export const ChangeTypeIdCodec = StringKey as t.Codec<ChangeTypeID>;
