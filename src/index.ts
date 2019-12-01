import {Application, Context, Octokit} from 'probot';
import * as store from './store';
import {GitHubAPI} from 'probot/lib/github';
import {URL} from 'url';
// tslint:disable-next-line:no-implicit-dependencies
import Webhooks = require('@octokit/webhooks');
import PullChangeLog, {SectionTitle} from './PullChangeLog';
import GitHubAuthentication from '@authentication/github';
import Cookie from '@authentication/cookie';

const githubAccountCookie = new Cookie<string>('github_account', {
  maxAge: '7 days',
});

const gitHubAuthentication = new GitHubAuthentication<{path: string}>({
  callbackURL: '/__/auth/github',
});

interface PackageInfo {
  packageName: string;
  isPrivate: boolean;
  /**
   * semver version of the package in the master branch. This may be ahead of the version
   * in npm and is based on taking the last git tag, and bumping based on changelog from
   * that version onwards.
   */
  versionOnMaster: string;
}

function attempt<T, S>(fn: () => T, fallback: (ex: any) => S) {
  try {
    return fn();
  } catch (ex) {
    return fallback(ex);
  }
}

if (!process.env.APP_NAME) {
  throw new Error('You must specify the APP_NAME env var');
}
const APP_NAME = process.env.APP_NAME;

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

  app.router.get(`/:owner/:repo/pulls/:number`, async (req, res, next) => {
    try {
      const account = githubAccountCookie.get(req, res);
      if (!account) {
        gitHubAuthentication.redirectToProvider(req, res, next, {
          state: {path: req.url},
        });
        return;
      }
      const {owner, repo} = req.params;
      const installationID = await store.getInstallationID(owner);
      if (!installationID) {
        throw new Error(
          `Changelog Version does not seem to be installed for ${owner}`,
        );
      }
      const pull_number = parseInt(req.params.number, 10);
      const github = await app.auth(installationID);
      const pullRequest = await getPullRequest(
        github,
        {number: pull_number, owner, repo},
        account,
      );
      if (!pullRequest) {
        throw new Error(
          `You do not appear to have permission to edit the changelog for ${owner}/${repo}`,
        );
      }

      const status = getStatus(github, {
        number: pull_number,
        owner,
        repo,
        headSha: pullRequest.data.head.sha,
      });

      // TODO: render UI for editing changelog
      res.json(status);
    } catch (ex) {
      next(ex);
    }
  });

  app.router.post(`/:owner/:repo/pulls/:number`, async (req, res, next) => {
    try {
      const account = githubAccountCookie.get(req, res);
      if (!account) {
        throw new Error('You must be authenticated first');
      }
      const {owner, repo} = req.params;
      const installationID = await store.getInstallationID(owner);
      if (!installationID) {
        throw new Error(
          `Changelog Version does not seem to be installed for ${owner}`,
        );
      }
      const pull_number = parseInt(req.params.number, 10);
      const github = await app.auth(installationID);
      const pullRequest = await getPullRequest(
        github,
        {number: pull_number, owner, repo},
        account,
      );
      if (!pullRequest) {
        throw new Error(
          `You do not appear to have permission to edit the changelog for ${owner}/${repo}`,
        );
      }

      // TODO: save the updated status here
    } catch (ex) {
      next(ex);
    }
  });
  async function getPullRequest(
    github: GitHubAPI,
    pr: {number: number; owner: string; repo: string},
    account: string,
  ) {
    try {
      const pull = await github.pulls.get({
        owner: pr.owner,
        repo: pr.repo,
        pull_number: pr.number,
      });
      const permission = await github.repos.getCollaboratorPermissionLevel({
        owner: pr.owner,
        repo: pr.repo,
        username: account,
      });
      if (
        permission.data.permission === 'admin' ||
        permission.data.permission === 'write' ||
        pull.data.user.login === account
      ) {
        return pull;
      }
      return undefined;
    } catch (ex) {
      return undefined;
    }
  }
  app.router.get(gitHubAuthentication.callbackPath, async (req, res, next) => {
    try {
      if (gitHubAuthentication.userCancelledLogin(req)) {
        res.send('Authentication Failed');
        return;
      }
      const {
        rawProfile,
        state,
      } = await gitHubAuthentication.completeAuthentication(req, res);
      githubAccountCookie.set(req, res, rawProfile.login);
      res.redirect(state!.path);
    } catch (ex) {
      next(ex);
    }
  });

  app.on('installation', async (context) => {
    await store.setInstallationID(
      context.payload.installation.account.login,
      context.payload.installation.id,
    );
  });

  app.on('pull_request.opened', onUpdate);
  app.on('pull_request.edited', onUpdate);
  app.on('pull_request.synchronize', onUpdate);
  app.on('push', async (context) => {
    if (
      'refs/heads/' + context.payload.repository.default_branch ===
      context.payload.ref
    ) {
      const pulls = await context.github.pulls.list(
        context.repo({
          state: 'open',
          base: context.payload.repository.default_branch,
        }),
      );
      for (const pull of pulls) {
        await updatePR(
          context.github,
          {
            number: pull.number,
            repo: context.payload.repository.name,
            owner: context.payload.repository.owner.login,
            headSha: pull.head.sha,
          },
          await getStatus(context.github, {
            number: pull.number,
            repo: context.payload.repository.name,
            owner: context.payload.repository.owner.login,
            headSha: pull.head.sha,
          }),
        );
      }
    }
  });

  async function onUpdate(
    context: Context<Webhooks.WebhookPayloadPullRequest>,
  ) {
    if (
      context.payload.pull_request.base.ref !==
      'refs/heads/' + context.payload.repository.default_branch
    ) {
      return;
    }
    await updatePR(
      context.github,
      {
        number: context.payload.number,
        repo: context.payload.repository.name,
        owner: context.payload.repository.owner.login,
        headSha: context.payload.pull_request.head.sha,
      },
      await getStatus(context.github, {
        number: context.payload.number,
        repo: context.payload.repository.name,
        owner: context.payload.repository.owner.login,
        headSha: context.payload.pull_request.head.sha,
      }),
    );
  }

  async function getPackages(
    _github: GitHubAPI,
    _pr: {number: number; owner: string; repo: string; headSha: string},
  ): Promise<PackageInfo[]> {
    const packages: PackageInfo[] = [];
    // TODO: fetch all `package.json` files
    return packages;
  }
  async function getStatus(
    github: GitHubAPI,
    pr: {number: number; owner: string; repo: string; headSha: string},
  ): Promise<{
    existingComment: Octokit.IssuesListCommentsResponseItem | undefined;
    status: PullChangeLog;
    packages: PackageInfo[];
  }> {
    const comments = await github.issues.listComments({
      issue_number: pr.number,
      owner: pr.owner,
      repo: pr.repo,
      per_page: 100,
    });
    const existingComment = comments.data.find(
      (comment) => comment.user.login === APP_NAME + '[bot]',
    );
    const status: PullChangeLog = (existingComment
      ? readState(existingComment.body)
      : undefined) || {submitted: false, packages: []};
    const packages = await getPackages(github, pr);
    for (const pkg of packages) {
      if (!status.packages.some((p) => p.packageName === pkg.packageName)) {
        status.packages.push({
          ...pkg,
          changes: [],
        });
      }
    }

    status.packages.sort((a, b) => (a.packageName < b.packageName ? -1 : 1));
    return {existingComment, status, packages};
  }

  async function updatePR(
    github: GitHubAPI,
    pr: {number: any; owner: string; repo: string; headSha: string},
    {
      existingComment,
      status,
      packages,
    }: {
      existingComment: Octokit.IssuesListCommentsResponseItem | undefined;
      status: PullChangeLog;
      packages: PackageInfo[];
    },
  ) {
    if (!packages.length) return;
    const changelogURL = new URL(
      `/${pr.owner}/${pr.repo}/pulls/${pr.number}`,
      APP_URL,
    );
    function isPublic(packageName: string) {
      const pkg = packages.find((p) => p.packageName === packageName);
      return !!(pkg && !pkg.isPrivate);
    }
    function getState() {
      if (status.submitted) {
        return 'success';
      } else {
        return 'pending';
      }
    }
    function getCommentBody() {
      if (status.submitted) {
        const sections: string[] = [];

        for (const pkg of status.packages.filter(
          (p) => p.changes.length !== 0,
        )) {
          let headerLevel = '## ';
          if (status.packages.length !== 1) {
            headerLevel = '### ';
            sections.push(
              `## ${pkg.packageName}${
                !isPublic(pkg.packageName) ? ' (private)' : ''
              }`,
            );
          }
          (['breaking', 'feat', 'refactor', 'perf', 'fix'] as const).forEach(
            (type) => {
              const changes = pkg.changes.filter((c) => c.type === type);
              if (changes.length) {
                sections.push(
                  `${headerLevel}${SectionTitle[type]}\n\n${changes
                    .map(
                      (c) =>
                        `* ${c.title}${
                          c.body ? `\n\n${c.body.replace(/^/gm, '  ')}\n` : ``
                        }`,
                    )
                    .join('\n')}`,
                );
              }
            },
          );
        }
        if (status.packages.some((p) => p.changes.length === 0)) {
          sections.push(
            `## Packages with no changes\n\n${status.packages
              .filter((p) => p.changes.length === 0)
              .map(
                (p) =>
                  `* ${p.packageName}${
                    !isPublic(p.packageName) ? ' (private)' : ''
                  }`,
              )
              .join('\n')}`,
          );
        }
        return `${sections.join(
          '\n\n',
        )}\n\nTo update the change log, please open: ${changelogURL.href}`;
      }
      return `This PR does not have any changelog associated with it.\n\nTo add a change log, please open: ${changelogURL.href}`;
    }
    function getShortDescription() {
      if (status.submitted) {
        if (status.packages.every((p) => p.changes.length === 0)) {
          return 'no changes to release';
        }
        if (
          status.packages.every(
            (p) => p.changes.length === 0 || !isPublic(p.packageName),
          )
        ) {
          return 'no public changes to release';
        }
        const publicReleases = status.packages.filter(
          (p) => p.changes.length > 0 && isPublic(p.packageName),
        );
        if (publicReleases.length === 1) {
          return `releasing ${publicReleases[0].packageName}`;
        }
        return 'releasing multiple packages';
      }
      return 'please add a changelog';
    }
    if (existingComment) {
      await github.issues.updateComment({
        owner: pr.owner,
        repo: pr.repo,
        body:
          `<!-- This comment is maintained by Changelog Version. Do not edit it manually! -->\n\n` +
          writeState(getCommentBody(), status),
        comment_id: existingComment.id,
      });
    } else {
      await github.issues.createComment({
        issue_number: pr.number,
        owner: pr.owner,
        repo: pr.repo,
        body:
          `<!-- This comment is maintained by Changelog Version. Do not edit it manually! -->\n\n` +
          writeState(getCommentBody(), status),
      });
    }
    await github.repos.createStatus({
      owner: pr.owner,
      repo: pr.repo,
      sha: pr.headSha,
      state: getState(),
      target_url: changelogURL.href,
      description: getShortDescription(),
      context: 'Changelog',
    });
  }
}

const stateRegex = /\n\n<!-- """ChangeLogVersion State Start""" (.*) """ChangeLogVersion State End""" -->/;
function readState(body: string): PullChangeLog | undefined {
  const match = stateRegex.exec(body);

  if (match) {
    const data = JSON.parse(match[1]);
    return data;
  }
  return undefined;
}

function writeState(body: string, state: PullChangeLog) {
  const src = body.replace(stateRegex, '');
  return (
    src +
    `\n\n<!-- """ChangeLogVersion State Start""" ${JSON.stringify(
      state,
    )} """ChangeLogVersion State End""" -->`
  );
}
