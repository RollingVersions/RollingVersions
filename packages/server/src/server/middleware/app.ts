import escapeHTML from 'escape-html';
import {Router} from 'express';

import db from '@rollingversions/db';

import {PullRequestResponseCodec} from '../../types';
import {getClientForRepo, getClientForToken} from '../getClient';
import {expressLogger} from '../logger';
import {getRepositoryFromRestParams} from '../models/Repositories';
import fixupForkPullRequests from './api/fixupForkPullRequests';
import getPastReleases from './api/getPastReleases';
import getPullRequest from './api/getPullRequest';
import getRepository from './api/getRepository';
import setReleaseDescription from './api/setReleaseDescription';
import triggerRelease from './api/triggerRelease';
import updatePullRequest from './api/updatePullRequest';
import {requiresAuth, getGitHubAccessToken} from './auth';
import checkPermissions, {
  getPermission,
  getUser,
  checkRepoPermissions,
  getRepoPermission,
  checkAdminPermissions,
} from './utils/checkPermissions';
import validateBody, {
  getBody,
  getSetReleaseDescriptionBody,
  validateSetReleaseDescriptionBody,
} from './utils/validateBody';
import validateParams, {
  parseParams,
  validateRepoParams,
  parseRepoParams,
} from './utils/validateParams';

const appMiddleware = Router();

appMiddleware.get(
  `/:owner/:repo/json`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const {owner, repo, commit, branch} = parseRepoParams(req);
      const client = await getClientForRepo({owner, name: repo});
      const dbRepo = await getRepositoryFromRestParams(db, client, {
        owner,
        name: repo,
      });
      if (!dbRepo) {
        res.status(404).send(`Unable to find the repository/branch`);
      }
      const response = await getRepository(
        client,
        {owner, name: repo},
        {commit, branch},
        expressLogger(req, res),
      );
      if (!response) {
        res.status(404).send(`Unable to find the repository/branch`);
      } else {
        res.json(response);
      }
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.get(
  `/:owner/:repo/past-releases`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['view', 'edit']),
  async (req, res, next) => {
    try {
      const permission = getRepoPermission(req);
      const {owner, repo, commit, branch} = parseRepoParams(req);
      const packageName: string | undefined = req.query[`package-name`];
      const before: string | undefined = req.query[`before`];
      const client = await getClientForRepo({owner, name: repo});
      const dbRepo = await getRepositoryFromRestParams(db, client, {
        owner,
        name: repo,
      });
      if (!dbRepo) {
        res.status(404).send(`Unable to find the repository/branch`);
        return;
      }
      const response = await getPastReleases(
        client,
        {owner, name: repo},
        {commit, branch, packageName, before, permission},
        expressLogger(req, res),
      );
      if (!response) {
        res.status(404).send(`Unable to find the repository/branch`);
      } else {
        res.json(response);
      }
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
      const params = parseRepoParams(req);
      const authToken = getGitHubAccessToken(req, res);
      const client = getClientForToken(authToken);
      const redirectTo = await triggerRelease(
        db,
        client,
        {...params, authToken},
        expressLogger(req, res),
      );

      if (redirectTo) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        return res.redirect(redirectTo);
      } else {
        res.status(404).send(`Unable to find the repository/branch`);
      }
    } catch (ex) {
      next(ex);
    }
  },
);
appMiddleware.post(
  `/:owner/:repo/set_release_description`,
  requiresAuth({api: true}),
  validateRepoParams(),
  checkRepoPermissions(['edit']),
  validateSetReleaseDescriptionBody(),
  async (req, res, next) => {
    try {
      const token = getGitHubAccessToken(req, res);
      const client = getClientForToken(token);
      const {owner, repo} = parseRepoParams(req);
      const body = getSetReleaseDescriptionBody(req);
      await setReleaseDescription(
        client,
        getUser(req),
        {owner, name: repo},
        body,
        expressLogger(req, res),
      );
      res.json({ok: true});
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
        expressLogger(req, res),
      );

      if (!response) {
        res.status(404).send(`Unable to find the pull request`);
      } else {
        res.json(PullRequestResponseCodec.serialize(response));
      }
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

      const updated = await updatePullRequest(
        client,
        getUser(req),
        pullRequest,
        body,
        expressLogger(req, res),
      );

      if (!updated) {
        res.status(404).send(`Unable to find the pull request`);
      } else {
        res.status(200).send('ok');
      }
    } catch (ex) {
      next(ex);
    }
  },
);

appMiddleware.get(
  `/fixup`,
  requiresAuth(),
  checkAdminPermissions(),
  async (req, res, next) => {
    try {
      const after = `${req.query.after || ``}`.trim() || undefined;
      const results = await fixupForkPullRequests(after);
      res.send(
        `<p>Checked Repositories:</p><ul>${results.checkedRepos
          .map((r) => `<li>${escapeHTML(r)}</li>`)
          .join(``)}</ul><p>Errors:</p><ul>${results.errors
          .map((e) => `<li>${escapeHTML(e)}</li>`)
          .join(
            ``,
          )}</ul><p>Pull requests to remove:</p><ul>${results.pullRequestsToRemove
          .map(
            (pr) =>
              `<li><a href="${escapeHTML(pr.url)}">${escapeHTML(
                pr.title,
              )}</a></li>`,
          )
          .join(``)}</ul>${
          results.lastRepo
            ? `<p><a href="/fixup?after=${encodeURIComponent(
                escapeHTML(results.lastRepo),
              )}">Next</a></p>`
            : ``
        }`,
      );
    } catch (ex) {
      next(ex);
    }
  },
);

export default appMiddleware;
