import {Router} from 'express';
import {requiresAuth, getGitHubAccessToken} from './auth';
import {getClientForToken} from '../getClient';
import {PullRequestResponse} from '../../types';
import validateParams, {
  parseParams,
  validateRepoParams,
  parseRepoParams,
} from './utils/validateParams';
import checkPermissions, {
  getPermission,
  getUser,
  checkRepoPermissions,
} from './utils/checkPermissions';
import validateBody, {getBody} from './utils/validateBody';
import updatePullRequest from './api/updatePullRequest';
import getPullRequest from './api/getPullRequest';
import getRepository from './api/getRepository';
import {createServerContextForRequest} from '../ServerContext';

const appMiddleware = Router();

appMiddleware.get(
  `/:owner/:repo/json`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const repo = parseRepoParams(req);
      const ctx = createServerContextForRequest(req, res, {
        repo,
        pr_number: null,
        user: getUser(req),
      });
      const response = await getRepository(ctx, repo);
      if (!response) {
        next();
        return;
      }
      res.json(response);
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/dispatch/rollingversions_publish_approved`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['edit']),
  async (req, res, next) => {
    try {
      const repo = parseRepoParams(req);
      const token = getGitHubAccessToken(req, res);
      const client = getClientForToken(token);
      await client.rest.repos.createDispatchEvent({
        owner: repo.owner,
        repo: repo.name,
        event_type: 'rollingversions_publish_approved',
      });
      await new Promise((resolve) => setTimeout(resolve, 4000));
      res.redirect(
        `https://github.com/${repo.owner}/${repo.name}/actions?query=event%3Arepository_dispatch`,
      );
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.get(
  `/:owner/:repo/pull/:pr_number/json`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const ctx = createServerContextForRequest(req, res, {
        repo: pullRequest.repo,
        pr_number: pullRequest.number,
        user: getUser(req),
      });
      const response = await getPullRequest(
        ctx,
        pullRequest,
        getPermission(req),
      );

      if (!response) {
        next();
        return;
      }

      res.json(PullRequestResponse.serialize(response));
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/pull/:pr_number`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['edit']),
  validateBody(),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const ctx = createServerContextForRequest(req, res, {
        repo: pullRequest.repo,
        pr_number: pullRequest.number,
        user: getUser(req),
      });
      const body = getBody(req);

      const response = await updatePullRequest(ctx, pullRequest, body);
      if (!response) {
        next();
        return;
      }

      res.status(200).send('ok');
    } catch (ex) {
      next(ex);
    }
  },
);

export default appMiddleware;
