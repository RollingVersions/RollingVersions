import {t} from '../utils/ValidationCodec';

type PublishConfigAccess = 'restricted' | 'public';
export default PublishConfigAccess;

export const PublishConfigAccessCodec = t.Union(
  t.Literal('restricted'),
  t.Literal('public'),
);
