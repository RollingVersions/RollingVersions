// tslint:disable-next-line: no-implicit-dependencies
import {Router} from 'express';
import getUnreleasedPackages from 'rollingversions/lib/utils/getUnreleasedPackages';
import {requiresAuth} from './auth';
import {getClientForRepo} from '../getClient';
import {PullRequestResponseCodec, RepoResponse} from '../../types';
import updatePullRequestWithState from '../actions/updatePullRequestWithState';
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
import getPullRequestState from '../getPullRequestState';
import log from '../logger';
import {ChangeTypes} from 'rollingversions/lib/types/PullRequestState';
import listPackages from 'rollingversions/lib/utils/listPackages';
import {
  getAllTags,
  getAllFiles,
  getAllCommits,
  getBranch,
} from 'rollingversions/lib/services/github';
import getPackageStatuses, {
  isPackageStatus,
  PackageStatus,
} from 'rollingversions/lib/utils/getPackageStatuses';
import splitAsyncGenerator from 'rollingversions/lib/ts-utils/splitAsyncGenerator';
import orFn from 'rollingversions/lib/ts-utils/orFn';
import arrayEvery from 'rollingversions/lib/ts-utils/arrayEvery';
import sortPackages from 'rollingversions/lib/utils/sortPackages';

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

      const branch = await getBranch(client, repo);
      const packageInfos = await listPackages(
        getAllTags(client, repo),
        getAllFiles(client, repo),
      );

      const getAllCommitsCached = splitAsyncGenerator(
        getAllCommits(client, repo),
      );

      const unsortedPackageStatuses = await getPackageStatuses(
        client,
        repo,
        packageInfos,
        async (sinceCommitSha) => {
          const results: {associatedPullRequests: {number: number}[]}[] = [];
          for await (const commit of getAllCommitsCached()) {
            if (commit.oid === sinceCommitSha) {
              return results;
            }
            results.push(commit);
          }
          return results;
        },
      );

      const isSuccessPackageStatus = orFn(
        isPackageStatus(PackageStatus.NewVersionToBePublished),
        isPackageStatus(PackageStatus.NoUpdateRequired),
      );

      if (!arrayEvery(unsortedPackageStatuses, isSuccessPackageStatus)) {
        const response: RepoResponse = {
          headSha: branch?.headSha || null,
          packages: unsortedPackageStatuses,
          cycleDetected: null,
        };
        res.json(response);
        return;
      }

      const sortResult = await sortPackages(unsortedPackageStatuses);

      if (sortResult.circular) {
        const response: RepoResponse = {
          headSha: branch?.headSha || null,
          packages: unsortedPackageStatuses,
          cycleDetected: sortResult.packageNames,
        };
        res.json(response);
        return;
      } else {
        const response: RepoResponse = {
          headSha: branch?.headSha || null,
          packages: sortResult.packages,
          cycleDetected: null,
        };
        res.json(response);
        return;
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
      const client = await getClientForRepo(repo);
      await client.rest.repos.createDispatchEvent({
        owner: repo.owner,
        repo: repo.name,
        event_type: 'rollingversions_publish_approved',
      });
      res.redirect(`https://github.com/${repo.owner}/${repo.name}/actions`);
    } catch (ex) {
      next(ex);
    }
  },
);

const loadStart = new Map<string, number>();
setInterval(() => {
  for (const [key, timestamp] of loadStart) {
    if (Date.now() - timestamp > 60 * 60_000) {
      loadStart.delete(key);
    }
  }
}, 60_000);
appMiddleware.get(
  `/:owner/:repo/pull/:pull_number/json`,
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
  `/:owner/:repo/pull/:pull_number`,
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
