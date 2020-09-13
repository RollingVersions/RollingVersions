import {Response, Request} from 'express';
import {UpdatePullRequestBody} from '../../../types';

export default function validateBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = UpdatePullRequestBody.safeParse(req.body);
    if (result.success) next();
    else
      res
        .status(400)
        .send(
          `${
            result.key ? `${result.message} in ${result.key}` : result.message
          }\n`,
        );
  };
}
export function getBody(req: Request): UpdatePullRequestBody {
  const result = UpdatePullRequestBody.safeParse(req.body);
  if (result.success) return result.value;
  else throw new Error(result.message);
}
