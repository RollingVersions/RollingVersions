import {Response, Request} from 'express';
import {
  UpdatePullRequestBody,
  UpdatePullRequestBodyCodec,
} from '../../../types';

export default function validateBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = UpdatePullRequestBodyCodec.decode(req.body);
    if (result.valid) next();
    else res.status(400).send(result.reason + '\n');
  };
}
export function getBody(req: Request): UpdatePullRequestBody {
  const result = UpdatePullRequestBodyCodec.decode(req.body);
  if (result.valid) return result.value;
  else throw new Error(result.reason);
}
