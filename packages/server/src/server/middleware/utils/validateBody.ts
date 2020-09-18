import {Response, Request} from 'express';
import {showError} from 'funtypes';
import {UpdatePullRequestBody} from '../../../types';

export default function validateBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = UpdatePullRequestBody.safeParse(req.body);
    if (result.success) next();
    else res.status(400).send(`${showError(result)}\n`);
  };
}
export function getBody(req: Request): UpdatePullRequestBody {
  return UpdatePullRequestBody.parse(req.body);
}
