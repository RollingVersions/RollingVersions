import * as t from 'funtypes';

type PublishConfigAccess = 'restricted' | 'public';
export default PublishConfigAccess;

export const PublishConfigAccessCodec = t.Union(
  t.Literal('restricted'),
  t.Literal('public'),
);
