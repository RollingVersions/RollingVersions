// tslint:disable-next-line: no-implicit-dependencies
import {Router} from 'express';
import {requiresAuth, getGitHubAccessToken} from './auth';
import {getClientForRepo, getClientForToken} from '../getClient';
import {PullRequestResponseCodec} from '../../types';
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

const appMiddleware = Router();

appMiddleware.get(
  `/:owner/:repo/json`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const repo = parseRepoParams(req);
      const client = await getClientForRepo(repo);
      const response = await getRepository(client, repo);
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
  `/:owner/:repo/pull/:pull_number/json`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const client = await getClientForRepo(pullRequest.repo);
      const response = await getPullRequest(
        client,
        getUser(req),
        pullRequest,
        getPermission(req),
      );

      res.json(PullRequestResponseCodec.encode(response));
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/pull/:pull_number`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions(['edit']),
  validateBody(),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const client = await getClientForRepo(pullRequest.repo);
      const body = getBody(req);

      await updatePullRequest(client, getUser(req), pullRequest, body);

      res.status(200).send('ok');
    } catch (ex) {
      next(ex);
    }
  },
);

export default appMiddleware;
