import type {Response, Request} from 'express';

import {PullRequest} from '@rollingversions/types';

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
export function parseParams(req: Request): PullRequest {
  if (!validRequests.has(req)) {
    throw new Error(
      'This request has not been passed through the validation middleware',
    );
  }
  const {owner, repo, pull_number} = req.params;
  return {repo: {owner, name: repo}, number: parseInt(pull_number, 10)};
}

const validRepoRequests = new WeakSet<Request>();
export function validateRepoParams() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const {owner, repo} = req.params;
    if (!owner) {
      res.status(400).send('Expected a owner parameter');
    } else if (!repo) {
      res.status(400).send('Expected a repo parameter');
    } else if (
      req.query.commit !== undefined &&
      typeof req.query.commit !== 'string'
    ) {
      res.status(400).send('Expected commit to be a string, if specified.');
    } else if (
      req.query.branch !== undefined &&
      typeof req.query.branch !== 'string'
    ) {
      res.status(400).send('Expected branch to be a string, if specified.');
    } else {
      validRepoRequests.add(req);
      next();
    }
  };
}
export function parseRepoParams(
  req: Request,
): {
  owner: string;
  repo: string;
  commit?: string;
  branch?: string;
} {
  if (!validRepoRequests.has(req)) {
    throw new Error(
      'This request has not been passed through the validation middleware',
    );
  }
  const {owner, repo} = req.params;
  return {
    owner,
    repo,
    commit: req.query.commit ?? undefined,
    branch: req.query.branch ?? undefined,
  };
}
