import VersionBumpType from './VersionBumpType';

type VersionSchema = readonly [
  VersionBumpType,
  ...(readonly VersionBumpType[])
];
export default VersionSchema;
