import escape from 'escape-html';
import {Router} from 'express';

import db, {q, tables} from '@rollingversions/db';

import {PullRequestResponseCodec} from '../../types';
import {getClientForRepo, getClientForToken} from '../getClient';
import {expressLogger} from '../logger';
import {refreshPullRequestMergeCommits} from '../models/PullRequests';
import {getRepositoryFromRestParams} from '../models/Repositories';
import getPullRequest from './api/getPullRequest';
import getRepository from './api/getRepository';
import updatePullRequest from './api/updatePullRequest';
import {requiresAuth, getGitHubAccessToken} from './auth';
import checkPermissions, {
  getPermission,
  getUser,
  checkRepoPermissions,
  checkAdminPermissions,
} from './utils/checkPermissions';
import validateBody, {getBody} from './utils/validateBody';
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
        repo: repo.repo,
        event_type: 'rollingversions_publish_approved',
        // TODO: include parameters for branch name and commit sha
      });
      await new Promise((resolve) => setTimeout(resolve, 4000));
      res.redirect(
        `https://github.com/${repo.owner}/${repo.repo}/actions?query=event%3Arepository_dispatch`,
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
  `/refresh-merge-commits`,
  requiresAuth(),
  checkAdminPermissions(),
  async (req, res, next) => {
    let started = false;
    try {
      const start = Date.now();
      const repositories = await tables
        .git_repositories(db)
        .find(
          req.query.after
            ? {id: q.greaterThan(parseInt(req.query.after, 10))}
            : {},
        )
        .orderByAsc(`id`)
        .limit(50);
      started = true;
      res.write(`<ul>`);
      let greatest = null;
      for (const repo of repositories) {
        if (Date.now() - start > 10_000) break;
        await refreshPullRequestMergeCommits(
          db,
          await getClientForRepo(repo),
          repo,
          expressLogger(req, res),
        );
        greatest = repo.id;

        res.write(`<li>${escape(repo.owner)}/${escape(repo.name)}</li>`);
      }
      res.write(`</ul>`);
      if (greatest) {
        res.write(
          `<a href="/refresh-merge-commits?after=${greatest}">Next</a>`,
        );
      }
      res.end();
    } catch (ex) {
      if (!started) {
        next(ex);
      } else {
        res.end(`<pre>${escape(`${ex.stack || ex.message || ex}`)}</pre>`);
      }
    }
  },
);

export default appMiddleware;
