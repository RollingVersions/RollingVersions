import {Application, Context, Octokit} from 'probot';
import {URL} from 'url';
// tslint:disable-next-line:no-implicit-dependencies
import Webhooks from '@octokit/webhooks';
import {
  readComment,
  writeComment,
  updateStatus,
  listPackages,
} from 'changelogversion-utils/lib/GitHub';
// tslint:disable-next-line:no-implicit-dependencies
import {Request, Response} from 'express';
import {json} from 'body-parser';
import {
  handleAuthCallback,
  getGitHubAccessTokenOrRedirectForAuth,
  getGitHubAccessToken,
  authCallbackPath,
} from './auth';
import getPermissionLevel, {Permission} from './getPermissionLevel';
import getClient from './getClient';
import staticServer from './static';
import {PullRequest} from './types';
import PullChangeLog from 'changelogversion-utils/lib/PullChangeLog';

function attempt<T, S>(fn: () => T, fallback: (ex: any) => S) {
  try {
    return fn();
  } catch (ex) {
    return fallback(ex);
  }
}

if (!process.env.APP_URL) {
  throw new Error('You must specify the APP_URL env var');
}
const APP_URL = attempt(
  () => new URL(process.env.APP_URL!),
  (ex) => {
    throw new Error(`APP_URL should be a valid URL: ${ex.message}`);
  },
);

export default function(app: Application) {
  // Your code here
  app.log('Yay, the app was loaded!');

  async function endStatus(
    res: Response,
    code: number,
    message: string,
  ): Promise<never> {
    res.status(code).send(message);
    return new Promise(() => {
      // never resolve as we've already sent a response
    });
  }
  async function notFound(next: (err?: any) => void): Promise<never> {
    next();
    return new Promise(() => {
      // never resolve as we've already sent a response
    });
  }
  async function parseParams(
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ) {
    const {owner, repo, pull_number} = req.params;
    if (!owner) return endStatus(res, 400, 'Expected owner parameter');
    if (!repo) return endStatus(res, 400, 'Expected repo parameter');
    if (!pull_number)
      return endStatus(res, 400, 'Expected pull_number parameter');
    if (!/^\d+$/.test(pull_number) || pull_number.length > 6) {
      return notFound(next);
    }
    return {owner, repo, pull_number: parseInt(pull_number, 10)};
  }

  app.router.get(`/:owner/:repo/pulls/:pull_number`, async (req, res, next) => {
    if (getGitHubAccessTokenOrRedirectForAuth(req, res, next)) {
      next();
    }
  });
  app.router.get(
    `/:owner/:repo/pulls/:pull_number/json`,
    async (req, res, next) => {
      try {
        const userAuth = getGitHubAccessToken(req, res);
        if (userAuth === null) {
          res.status(401).send('You must be authenticated first');
          return;
        }
        const params = await parseParams(req, res, next);
        const permission = await getPermissionLevel({...params, userAuth});
        if (permission === Permission.None) {
          next();
          return;
        }
        const github = await getClient(app, params);
        // TODO: render UI for editing changelog
        const headSha = (
          await github.pulls.get({
            owner: params.owner,
            repo: params.repo,
            pull_number: params.pull_number,
          })
        ).data.head.sha;
        const {packageInfoCache, ...changeLogState} = (
          await readComment(github, {
            number: params.pull_number,
            owner: params.owner,
            repo: params.repo,
          })
        ).state;
        const pullRequest: PullRequest = {
          headSha,
          permission,
          changeLogState,
          currentVersions:
            packageInfoCache && packageInfoCache.headSha === headSha
              ? packageInfoCache.packages
              : await listPackages(github, {
                  owner: params.owner,
                  repo: params.repo,
                  headSha,
                }),
        };
        res.json(pullRequest);
      } catch (ex) {
        next(ex);
      }
    },
  );

  app.router.post(
    `/:owner/:repo/pulls/:pull_number`,
    json(),
    async (req, res, next) => {
      try {
        const userAuth = getGitHubAccessToken(req, res);
        if (userAuth === null) {
          res.status(401).send('You must be authenticated first');
          return;
        }
        const params = await parseParams(req, res, next);
        const permission = await getPermissionLevel({...params, userAuth});
        if (permission === Permission.None) {
          next();
          return;
        }
        if (permission !== Permission.Edit) {
          res
            .status(401)
            .send('You do not have permission to edit this changelog');
          return;
        }

        const github = await getClient(app, params);

        const body: PullRequest['changeLogState'] = req.body;
        await updatePRWithState(github, params, body);
        res.status(200).send('ok');
      } catch (ex) {
        next(ex);
      }
    },
  );

  app.router.get(authCallbackPath, handleAuthCallback());

  app.router.use(staticServer);

  app.on('installation', async (context) => {
    for (const r of context.payload.repositories) {
      const repo = (
        await context.github.repos.get({
          owner: context.payload.installation.account.login,
          repo: r.name,
        })
      ).data;
      await onUpdateRepoDebounced(context.github, repo);
    }
  });

  app.on('pull_request.opened', onUpdatePullRequest);
  app.on('pull_request.edited', onUpdatePullRequest);
  app.on('pull_request.synchronize', onUpdatePullRequest);
  app.on('release', async (context) => {
    await onUpdateRepoDebounced(context.github, context.payload.repository);
  });
  app.on('push', async (context) => {
    if (
      'refs/heads/' + context.payload.repository.default_branch ===
      context.payload.ref
    ) {
      await onUpdateRepoDebounced(context.github, context.payload.repository);
    }
  });

  const timeouts = new Map<
    string,
    | {pending: true; timeout: NodeJS.Timeout; resolve: () => void}
    | {pending: false; done: Promise<void>}
  >();
  async function onUpdateRepoDebounced(
    github: Octokit,
    repo: Webhooks.PayloadRepository | Octokit.ReposGetResponse,
  ) {
    for (
      let timeout = timeouts.get(repo.full_name);
      timeout !== undefined;
      timeout = timeouts.get(repo.full_name)
    ) {
      if (timeout.pending) {
        clearTimeout(timeout.timeout);
        timeout.resolve();
        timeouts.delete(repo.full_name);
      } else {
        await timeout.done;
      }
    }
    await new Promise((resolve, reject) => {
      timeouts.set(repo.full_name, {
        pending: true,
        resolve,
        timeout: setTimeout(() => {
          const done = onUpdateRepo(github, repo).then(resolve, reject);
          timeouts.set(repo.full_name, {
            pending: false,
            done: done.then(() => {
              timeouts.delete(repo.full_name);
            }),
          });
          // We debounce by 10 seconds to allow for registry package publishing,
          // which might happen later than the github tag publishing.
          // This also helps to
        }, 10_000),
      });
    });
  }
  async function onUpdateRepo(
    github: Octokit,
    repo: Webhooks.PayloadRepository | Octokit.ReposGetResponse,
  ) {
    // TODO: pagination
    const pulls = await github.pulls.list({
      owner: repo.owner.login,
      repo: repo.name,
      state: 'open',
      base: repo.default_branch,
      per_page: 100,
    });
    for (const pull of pulls) {
      await updatePR(github, {
        owner: repo.owner.login,
        repo: repo.name,
        number: pull.number,
        headSha: pull.head.sha,
      });
    }
  }

  async function onUpdatePullRequest(
    context: Context<Webhooks.WebhookPayloadPullRequest>,
  ) {
    await updatePR(context.github, {
      owner: context.payload.repository.owner.login,
      repo: context.payload.repository.name,
      number: context.payload.pull_request.number,
      headSha: context.payload.pull_request.head.sha,
    });
  }

  async function updatePR(
    github: Octokit,
    pullRequest: {
      owner: string;
      repo: string;
      number: number;
      headSha: string;
    },
  ) {
    const {existingComment, state: oldState} = await readComment(
      github,
      pullRequest,
    );

    const currentVersions =
      oldState.packageInfoCache &&
      oldState.packageInfoCache.headSha === pullRequest.headSha
        ? oldState.packageInfoCache.packages
        : await listPackages(github, pullRequest);

    const state: PullChangeLog = {
      ...oldState,
      packageInfoCache: {
        headSha: pullRequest.headSha,
        packages: currentVersions,
      },
    };

    const pr = {...pullRequest, currentVersions};

    await writeComment(github, existingComment, pr, state, APP_URL);

    await updateStatus(github, pr, state, APP_URL);
  }

  async function updatePRWithState(
    github: Octokit,
    pullRequest: {
      owner: string;
      repo: string;
      pull_number: number;
    },
    state: PullRequest['changeLogState'],
  ) {
    const headSha = (await github.pulls.get(pullRequest)).data.head.sha;
    const {existingComment, state: oldState} = await readComment(github, {
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      number: pullRequest.pull_number,
    });
    const currentVersions =
      oldState.packageInfoCache && oldState.packageInfoCache.headSha === headSha
        ? oldState.packageInfoCache.packages
        : await listPackages(github, {
            owner: pullRequest.owner,
            repo: pullRequest.repo,
            headSha,
          });

    const pr = {
      owner: pullRequest.owner,
      repo: pullRequest.repo,
      number: pullRequest.pull_number,
      headSha,
      currentVersions,
    };

    const st = {...state, packageInfoCache: oldState.packageInfoCache};

    await writeComment(github, existingComment, pr, st, APP_URL);

    await updateStatus(github, pr, st, APP_URL);
  }
}
