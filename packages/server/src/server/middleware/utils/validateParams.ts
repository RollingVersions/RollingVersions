import {Response, Request} from 'express';
import {PullRequest} from 'rollingversions/lib/types';

const validRequests = new WeakSet<Request>();
export default function validateParams() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const {owner, repo, pull_number} = req.params;
    if (!owner) {
      res.status(400).send('Expected a owner parameter');
    } else if (!repo) {
      res.status(400).send('Expected a repo parameter');
    } else if (!pull_number) {
      res.status(400).send('Expected a pull_number parameter');
    } else if (!/^\d+$/.test(pull_number) || pull_number.length > 6) {
      res.status(404).send('This is not a valid pull request number');
    } else {
      validRequests.add(req);
      next();
    }
  };
}
export function parseParams(
  req: Request,
): Pick<PullRequest, 'repo' | 'number'> {
  if (!validRequests.has(req)) {
    throw new Error(
      'This request has not been passed through the validation middleware',
    );
  }
  const {owner, repo, pull_number} = req.params;
  return {repo: {owner, name: repo}, number: parseInt(pull_number, 10)};
}
