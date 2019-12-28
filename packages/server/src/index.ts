import {Application, Context, Octokit} from 'probot';
import {GitHubAPI} from 'probot/lib/github';
import {URL} from 'url';
// tslint:disable-next-line:no-implicit-dependencies
import Webhooks = require('@octokit/webhooks');
import GitHubAuthentication from '@authentication/github';
import Cookie from '@authentication/cookie';
import {
  readComment,
  writeComment,
  updateStatus,
} from 'changelogversion-utils/lib/GitHub';
// tslint:disable-next-line:no-implicit-dependencies
import {Request, Response} from 'express';

const githubTokenCookie = new Cookie<string>('github_account', {
  maxAge: '1 days',
});

const gitHubAuthentication = new GitHubAuthentication<{path: string}>({
  callbackURL: '/__/auth/github',
});

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

enum Permission {
  None,
  View,
  Edit,
}

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
  async function getPermissionLevel({
    owner,
    repo,
    pull_number,
    userAuth,
  }: {
    owner: string;
    repo: string;
    pull_number: number;
    userAuth: string;
  }): Promise<Permission> {
    const octokit = new Octokit({auth: userAuth});

    const authenticated = await octokit.users.getAuthenticated();
    let pull;
    try {
      pull = await octokit.pulls.get({owner, repo, pull_number});
    } catch (ex) {
      return Permission.None;
    }
    if (pull.data.merged) {
      return Permission.View;
    }
    if (pull.data.user.login === authenticated.data.login) {
      return Permission.Edit;
    }
    const permission = await octokit.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username: authenticated.data.login,
    });
    if (
      permission.data.permission === 'admin' ||
      permission.data.permission === 'write'
    ) {
      return Permission.Edit;
    }
    return Permission.View;
  }
  async function getClient({
    owner,
    repo,
  }: {
    owner: string;
    repo: string;
    pull_number: number;
  }) {
    const installation = await (await app.auth()).apps.getRepoInstallation({
      owner,
      repo,
    });
    if (installation.status !== 200) {
      throw new Error(
        `Changelog Version does not seem to be installed for ${owner}`,
      );
    }
    const installationID = installation.data.id;
    const github = await app.auth(installationID);
    return github;
  }

  app.router.get(`/:owner/:repo/pulls/:pull_number`, async (req, res, next) => {
    try {
      const userAuth = githubTokenCookie.get(req, res);
      if (!userAuth) {
        gitHubAuthentication.redirectToProvider(req, res, next, {
          state: {path: req.url},
        });
        return;
      }
      const params = await parseParams(req, res, next);
      const permission = await getPermissionLevel({...params, userAuth});
      if (permission === Permission.None) {
        next();
        return;
      }
      const github = await getClient(params);
      // TODO: render UI for editing changelog
      res.json(
        await readComment(github, {
          number: params.pull_number,
          owner: params.owner,
          repo: params.repo,
        }),
      );
    } catch (ex) {
      next(ex);
    }
  });

  app.router.post(
    `/:owner/:repo/pulls/:pull_number`,
    async (req, res, next) => {
      try {
        const userAuth = githubTokenCookie.get(req, res);
        if (!userAuth) {
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
        const github = await getClient(params);

        // TODO: save the updated status here
        res.json(
          await readComment(github, {
            number: params.pull_number,
            owner: params.owner,
            repo: params.repo,
          }),
        );
      } catch (ex) {
        next(ex);
      }
    },
  );

  app.router.get(gitHubAuthentication.callbackPath, async (req, res, next) => {
    try {
      if (gitHubAuthentication.userCancelledLogin(req)) {
        res.send('Authentication Failed');
        return;
      }
      const {
        accessToken,
        state,
      } = await gitHubAuthentication.completeAuthentication(req, res);
      githubTokenCookie.set(req, res, accessToken);
      res.redirect(state!.path);
    } catch (ex) {
      next(ex);
    }
  });

  app.on('installation', async (context) => {
    for (const r of context.payload.repositories) {
      const repo = (
        await context.github.repos.get({
          owner: context.payload.installation.account.login,
          repo: r.name,
        })
      ).data;
      // TODO: pagination
      const pulls = await context.github.pulls.list({
        owner: repo.owner.login,
        repo: repo.name,
        state: 'open',
        base: repo.default_branch,
        per_page: 100,
      });
      for (const pull of pulls) {
        await updatePR(context.github, {
          owner: repo.owner.login,
          repo: repo.name,
          number: pull.number,
          headSha: pull.head.sha,
        });
      }
    }
  });

  app.on('pull_request.opened', onUpdate);
  app.on('pull_request.edited', onUpdate);
  app.on('pull_request.synchronize', onUpdate);
  app.on('push', async (context) => {
    if (
      'refs/heads/' + context.payload.repository.default_branch ===
      context.payload.ref
    ) {
      const repo = context.payload.repository;
      // TODO: pagination
      const pulls = await context.github.pulls.list({
        owner: repo.owner.login,
        repo: repo.name,
        state: 'open',
        base: repo.default_branch,
        per_page: 100,
      });
      for (const pull of pulls) {
        await updatePR(context.github, {
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          number: pull.number,
          headSha: pull.head.sha,
        });
      }
    }
  });

  async function onUpdate(
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
    const $pullRequest = {
      ...pullRequest,
      // TODO: get current versions
      currentVersions: new Map(),
    };
    const {existingComment, state} = await readComment(github, pullRequest);

    await writeComment(github, existingComment, $pullRequest, state, APP_URL);

    await updateStatus(github, $pullRequest, state, APP_URL);
  }
}
