// tslint:disable-next-line: no-implicit-dependencies
import {Router} from 'express';
import getUnreleasedPackages from 'rollingversions/lib/utils/getUnreleasedPackages';
import {requiresAuth} from './auth';
import {getClientForRepo} from '../getClient';
import {PullRequestResponseCodec} from '../../types';
import updatePullRequestWithState from '../actions/updatePullRequestWithState';
import validateParams, {parseParams} from './utils/validateParams';
import checkPermissions, {
  getPermission,
  getUser,
} from './utils/checkPermissions';
import validateBody, {getBody} from './utils/validateBody';
import getPullRequestState from '../getPullRequestState';
import log from '../logger';
import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';

const appMiddleware = Router();

const loadStart = new Map<string, number>();

setInterval(() => {
  for (const [key, timestamp] of loadStart) {
    if (Date.now() - timestamp > 60 * 60_000) {
      loadStart.delete(key);
    }
  }
}, 60_000);
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

      const loadStartKey = `${getUser(req).login}/${pullRequest.repo.owner}/${
        pullRequest.repo.name
      }/${pullRequest.number}`;
      loadStart.set(loadStartKey, Date.now());

      log({
        event_status: 'ok',
        event_type: 'loaded_change_set',
        message: `Loaded change set`,
        packages_count: pr.state?.packages.size,
        closed: pr.closed,
        merged: pr.merged,
        repo_owner: pullRequest.repo.owner,
        repo_name: pullRequest.repo.name,
        pull_number: pullRequest.number,
        ...getUser(req),
      });

      res.json(
        PullRequestResponseCodec.encode({
          permission: getPermission(req),
          changeLogState: pr.state,
          closed: pr.closed,
          merged: pr.merged,
          unreleasedPackages: pr.state
            ? [
                ...(await getUnreleasedPackages(
                  client,
                  {
                    ...pullRequest,
                    closed: pr.closed || pr.merged,
                  },
                  pr.state.packages,
                )),
              ]
            : [],
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

      // TODO: prevent updating released packages

      const body = getBody(req);

      const loadStartKey = `${getUser(req).login}/${pullRequest.repo.owner}/${
        pullRequest.repo.name
      }/${pullRequest.number}`;
      const startTime = loadStart.get(loadStartKey);
      loadStart.delete(loadStartKey);

      log({
        event_status: 'ok',
        event_type: 'submitted_change_set',
        message: `Submitted change set`,
        time_taken_to_add_changeset_ms: startTime
          ? Date.now() - startTime
          : 60 * 60_000,
        changes_count: body.updates
          .map((u) =>
            ChangeTypes.map((ct) => u.changes[ct].length).reduce(
              (a, b) => a + b,
              0,
            ),
          )
          .reduce((a, b) => a + b, 0),
        repo_owner: pullRequest.repo.owner,
        repo_name: pullRequest.repo.name,
        pull_number: pullRequest.number,
        ...getUser(req),
      });

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
