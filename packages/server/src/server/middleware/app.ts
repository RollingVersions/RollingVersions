// tslint:disable-next-line: no-implicit-dependencies
import {Router} from 'express';
import {requiresAuth, getGitHubAccessToken} from './auth';
import getPermissionLevel, {
  Permission,
} from '../permissions/getPermissionLevel';
import {getClientForRepo} from '../getClient';
import {
  getPullRequestHeadSha,
  readComment,
  listPackages,
} from '@rollingversions/utils/lib/GitHub';
import {PullRequestResponse} from '../../types';
import updatePullRequestWithState from '../actions/updatePullRequestWithState';
import validateParams, {parseParams} from './utils/validateParams';
import checkPermissions from './utils/checkPermissions';
import validateBody, {getBody} from './utils/validateBody';

const appMiddleware = Router();

appMiddleware.get(
  `/:owner/:repo/pulls/:pull_number/json`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions([Permission.View, Permission.Edit]),
  async (req, res, next) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const pullRequest = parseParams(req);
      const github = await getClientForRepo(pullRequest.repo);

      const [
        permission,
        headSha,
        {
          state: {packageInfoCache, ...changeLogState},
        },
      ] = await Promise.all([
        getPermissionLevel(pullRequest, userAuth),
        getPullRequestHeadSha(github, pullRequest),
        readComment(github, pullRequest),
      ] as const);
      const pullRequestResponse: PullRequestResponse = {
        headSha: headSha || packageInfoCache?.headSha,
        permission,
        changeLogState,
        currentVersions:
          packageInfoCache && (!headSha || packageInfoCache.headSha === headSha)
            ? packageInfoCache.packages
            : await listPackages(github, pullRequest),
      };
      res.json(pullRequestResponse);
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.post(
  `/:owner/:repo/pulls/:pull_number`,
  requiresAuth({api: true}),
  validateParams(),
  checkPermissions([Permission.Edit]),
  validateBody(),
  async (req, res, next) => {
    try {
      const pullRequest = parseParams(req);
      const github = await getClientForRepo(pullRequest.repo);

      const body = getBody(req);
      await updatePullRequestWithState(github, pullRequest, body);
      res.status(200).send('ok');
    } catch (ex) {
      next(ex);
    }
  },
);

export default appMiddleware;
