import {Application, Context} from 'probot';
import {URL} from 'url';
// tslint:disable-next-line:no-implicit-dependencies
import Webhooks from '@octokit/webhooks';
import {
  readComment,
  writeComment,
  updateStatus,
  listPackages,
  getPullRequestHeadSha,
  GitHubClient,
} from '@changelogversion/utils/lib/GitHub';
import {
  renderComment,
  renderInitialComment,
} from '@changelogversion/utils/lib/Rendering';
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
import {getClientForContext, getClientForRepo} from './getClient';
import staticServer from './static';
import {PullRequestResponse} from './types';
import PullChangeLog from '@changelogversion/utils/lib/PullChangeLog';
import {PullRequest} from '@changelogversion/utils/lib/types';

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
    const userAuth = getGitHubAccessTokenOrRedirectForAuth(req, res, next);
    if (userAuth) {
      try {
        const params = await parseParams(req, res, next);
        const permission = await getPermissionLevel({...params, userAuth});
        if (permission === Permission.None) {
          res
            .status(404)
            .send(
              'Either this PR does not exist, you do not have acess to it, or Changelog Version is not installed on this repository.',
            );
          next();
          return;
        }
      } catch (ex) {
        next(ex);
        return;
      }
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
          res
            .status(404)
            .send(
              'Either this PR does not exist, you do not have acess to it, or Changelog Version is not installed on this repository.',
            );
          next();
          return;
        }
        const repo = {owner: params.owner, name: params.repo};
        const github = await getClientForRepo(app, repo);
        const pr = {number: params.pull_number, repo};
        const [
          headSha,
          {
            state: {packageInfoCache, ...changeLogState},
          },
        ] = await Promise.all([
          getPullRequestHeadSha(github, pr),
          readComment(github, {
            number: params.pull_number,
            repo: {owner: params.owner, name: params.repo},
          }),
        ] as const);
        const pullRequest: PullRequestResponse = {
          headSha: headSha!,
          permission,
          changeLogState,
          currentVersions:
            packageInfoCache && packageInfoCache.headSha === headSha
              ? packageInfoCache.packages
              : await listPackages(github, {
                  repo: {owner: params.owner, name: params.repo},
                  number: params.pull_number,
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

        const repo = {owner: params.owner, name: params.repo};
        const github = await getClientForRepo(app, repo);

        const body: PullRequestResponse['changeLogState'] = req.body;
        await updatePRWithState(
          github,
          {repo, number: params.pull_number},
          body,
        );
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
        await getClientForContext(context).rest.repos.get({
          owner: context.payload.installation.account.login,
          repo: r.name,
        })
      ).data;
      await onUpdateRepoDebounced(getClientForContext(context), repo);
    }
  });

  app.on('pull_request.opened', onUpdatePullRequest);
  app.on('pull_request.edited', onUpdatePullRequest);
  app.on('pull_request.synchronize', onUpdatePullRequest);
  app.on('release', async (context) => {
    await onUpdateRepoDebounced(
      getClientForContext(context),
      context.payload.repository,
    );
  });
  app.on('push', async (context) => {
    if (
      'refs/heads/' + context.payload.repository.default_branch ===
      context.payload.ref
    ) {
      await onUpdateRepoDebounced(
        getClientForContext(context),
        context.payload.repository,
      );
    }
  });

  const timeouts = new Map<
    string,
    | {pending: true; timeout: NodeJS.Timeout; resolve: () => void}
    | {pending: false; done: Promise<void>}
  >();
  async function onUpdateRepoDebounced(
    github: GitHubClient,
    repo: {
      full_name: string;
      owner: {login: string};
      name: string;
      default_branch: string;
    },
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
    github: GitHubClient,
    repo: {owner: {login: string}; name: string; default_branch: string},
  ) {
    // TODO: pagination
    const pulls = (
      await github.rest.pulls.list({
        owner: repo.owner.login,
        repo: repo.name,
        state: 'open',
        base: repo.default_branch,
        per_page: 100,
      })
    ).data;
    for (const pull of pulls) {
      await updatePR(github, {
        repo: {owner: repo.owner.login, name: repo.name},
        number: pull.number,
        headSha: pull.head.sha,
      });
    }
  }

  async function onUpdatePullRequest(
    context: Context<Webhooks.WebhookPayloadPullRequest>,
  ) {
    await updatePR(getClientForContext(context), {
      repo: {
        owner: context.payload.repository.owner.login,
        name: context.payload.repository.name,
      },
      number: context.payload.pull_request.number,
      headSha: context.payload.pull_request.head.sha,
    });
  }

  async function preparePR(
    github: GitHubClient,
    pullRequest: Pick<PullRequest, 'repo' | 'number'> &
      Partial<Pick<PullRequest, 'headSha'>>,
  ) {
    const queryResults = await Promise.all([
      pullRequest.headSha
        ? pullRequest.headSha
        : getPullRequestHeadSha(github, pullRequest),
      readComment(github, pullRequest),
    ] as const);
    let [, {existingComment}] = queryResults;
    const [headSha, {state}] = queryResults;

    if (!headSha) {
      throw new Error(
        `Could not find head sha for ${pullRequest.repo.owner}/${pullRequest.repo.name}/${pullRequest.number}`,
      );
    }

    if (!existingComment) {
      // If there is no status, we write an initial status as quickly as possible
      // without waiting until we've extracted all the package versions.
      // This improves percieved responsiveness and reduces the chance of use accidentally writing
      // two comments instead of one.
      existingComment = await writeComment(
        github,
        pullRequest,
        renderInitialComment(pullRequest, APP_URL),
        undefined,
      );
      await updateStatus(github, {...pullRequest, headSha}, undefined, APP_URL);
    }
    return {existingComment, headSha, state};
  }
  async function updatePR(
    github: GitHubClient,
    pullRequest: Pick<PullRequest, 'repo' | 'number' | 'headSha'>,
  ) {
    const {existingComment, state: oldState} = await preparePR(
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

    await writeComment(
      github,
      pr,
      renderComment(pr, state, APP_URL),
      existingComment,
    );

    await updateStatus(github, pr, state, APP_URL);
  }

  async function updatePRWithState(
    github: GitHubClient,
    pullRequest: Pick<PullRequest, 'repo' | 'number'>,
    state: PullRequestResponse['changeLogState'],
  ) {
    const {existingComment, headSha, state: oldState} = await preparePR(
      github,
      pullRequest,
    );

    const currentVersions =
      oldState.packageInfoCache && oldState.packageInfoCache.headSha === headSha
        ? oldState.packageInfoCache.packages
        : await listPackages(github, pullRequest);

    const pr = {
      ...pullRequest,
      headSha,
      currentVersions,
    };

    const st = {...state, packageInfoCache: oldState.packageInfoCache};

    await writeComment(
      github,
      pr,
      renderComment(pr, st, APP_URL),
      existingComment,
    );

    await updateStatus(github, pr, st, APP_URL);
  }
}
