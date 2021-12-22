import type {Response, Request} from 'express';
import {showError} from 'funtypes';

import {
  SetReleaseDescriptionBody,
  SetReleaseDescriptionBodyCodec,
  UpdatePullRequestBody,
  UpdatePullRequestBodyCodec,
} from '../../../types';

export default function validateBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = UpdatePullRequestBodyCodec.safeParse(req.body);
    if (result.success) next();
    else res.status(400).send(`${showError(result)}\n`);
  };
}
export function getBody(req: Request): UpdatePullRequestBody {
  return UpdatePullRequestBodyCodec.parse(req.body);
}

export function validateSetReleaseDescriptionBody() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const result = SetReleaseDescriptionBodyCodec.safeParse(req.body);
    if (result.success) next();
    else res.status(400).send(`${showError(result)}\n`);
  };
}
export function getSetReleaseDescriptionBody(
  req: Request,
): SetReleaseDescriptionBody {
  return SetReleaseDescriptionBodyCodec.parse(req.body);
}
