// tslint:disable-next-line: no-implicit-dependencies
import {Router} from 'express';
import {requiresAuth} from './auth';
import {getClientForRepo} from '../getClient';
import {PullRequestResponseCodec} from '../../types';
import updatePullRequestWithState from '../actions/updatePullRequestWithState';
import validateParams, {parseParams} from './utils/validateParams';
import checkPermissions, {getPermission} from './utils/checkPermissions';
import validateBody, {getBody} from './utils/validateBody';
import getPullRequestState from '../getPullRequestState';

const appMiddleware = Router();

appMiddleware.get(
  `/:owner/:repo/pulls/:pull_number/json`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const client = await getClientForRepo(pullRequest.repo);

      const pr = await getPullRequestState(client, pullRequest);

      res.json(
        PullRequestResponseCodec.encode({
          permission: getPermission(req),
          changeLogState: pr.state,
          closed: pr.closed,
          merged: pr.merged,
        }),
      );
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/pulls/:pull_number`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['edit']),
  validateBody(),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const github = await getClientForRepo(pullRequest.repo);

      const body = getBody(req);
      await updatePullRequestWithState(
        github,
        pullRequest,
        body.headSha,
        body.updates,
      );
      res.status(200).send('ok');
    } catch (ex) {
      next(ex);
    }
  },
);

export default appMiddleware;
