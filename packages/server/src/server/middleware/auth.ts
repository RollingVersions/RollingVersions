// tslint:disable-next-line: no-implicit-dependencies
import Cookie from '@authentication/cookie';
import GitHubAuthentication from '@authentication/github';
import type {Request, Response, NextFunction} from 'express';
import {Router} from 'express';

const authMiddleware = Router();

const githubTokenCookie = new Cookie<{accessToken: string}>('github_account', {
  maxAge: '1 days',
});

const gitHubAuthentication = new GitHubAuthentication<{path: string}>({
  callbackURL: '/__/auth/github',
});

authMiddleware.get(
  gitHubAuthentication.callbackPath,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (gitHubAuthentication.userCancelledLogin(req)) {
        res.send('Authentication Failed');
        return;
      }
      const {
        accessToken,
        state,
      } = await gitHubAuthentication.completeAuthenticationWithoutProfile(
        req,
        res,
      );
      githubTokenCookie.set(req, res, {accessToken});
      res.redirect(state!.path);
    } catch (ex) {
      next(ex);
    }
  },
);

export function requiresAuth({api}: {api?: boolean} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userAuth = githubTokenCookie.get(req, res);
    if (userAuth) {
      next();
    } else if (api) {
      res.status(401).send('You must be authenticated to use this API');
    } else {
      gitHubAuthentication.redirectToProvider(req, res, next, {
        state: {path: req.url},
        scope: ['read:user'],
      });
    }
  };
}

export function getGitHubAccessToken(req: Request, res: Response) {
  const accessToken = getOptionalGitHubAccessToken(req, res);
  if (!accessToken) {
    throw new Error('Missing access token');
  }
  return accessToken;
}

export function getOptionalGitHubAccessToken(req: Request, res: Response) {
  const userAuth = githubTokenCookie.get(req, res);
  if (!userAuth) {
    return null;
  }
  return userAuth.accessToken;
}

export default authMiddleware;
