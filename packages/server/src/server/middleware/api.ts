import {Router} from 'express';

import db, {tables} from '@rollingversions/db';

import {getClientForRepo, getClientForToken} from '../getClient';
import {expressLogger} from '../logger';
import getRepositoryForCli from './api/getRepositoryForCli';
import {validateRepoParams, parseRepoParams} from './utils/validateParams';

const apiMiddleware = Router();

apiMiddleware.get(
  `/api/:owner/:repo`,
  validateRepoParams(),
  async (req, res, next) => {
    try {
      if (
        typeof req.headers[`authorization`] !== 'string' ||
        !req.headers[`authorization`].startsWith(`Bearer `)
      ) {
        res
          .status(403)
          .send(`You must provide an authorization token to use the API`);
        return;
      }
      const authToken = req.headers[`authorization`].substr(`Bearer `.length);

      const {owner, repo, branch, versionByBranch} = parseRepoParams(req);

      const tokenClient = getClientForToken(authToken);
      const r = await tokenClient.rest.repos
        .get({owner, repo})
        .catch(() => null);
      if (r?.status !== 200) {
        res
          .status(404)
          .send(
            `The provided auth token does not have permission to access the repo, or it does not exist.`,
          );
        return;
      }
      const dbRepo = await tables
        .git_repositories(db)
        .findOne({owner, name: repo});
      if (!dbRepo) {
        res
          .status(404)
          .send(`This repository has not been added to Rolling Versions.`);
        return;
      }

      const client = await getClientForRepo({owner, name: repo});
      const response = await getRepositoryForCli(
        client,
        {owner, name: repo},
        {branch, versionByBranch},
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

export default apiMiddleware;
