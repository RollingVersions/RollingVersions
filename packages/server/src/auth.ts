// tslint:disable-next-line: no-implicit-dependencies
import {Request, Response, NextFunction} from 'express';
import GitHubAuthentication from '@authentication/github';
import Cookie from '@authentication/cookie';

const githubTokenCookie = new Cookie<{accessToken: string}>('github_account', {
  maxAge: '1 days',
});

const gitHubAuthentication = new GitHubAuthentication<{path: string}>({
  callbackURL: '/__/auth/github',
});

export const authCallbackPath = gitHubAuthentication.callbackPath;
export function getGitHubAccessToken(req: Request, res: Response) {
  const userAuth = githubTokenCookie.get(req, res);
  if (!userAuth) {
    return null;
  }
  return userAuth.accessToken;
}

export function getGitHubAccessTokenOrRedirectForAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userAuth = githubTokenCookie.get(req, res);
  if (!userAuth) {
    gitHubAuthentication.redirectToProvider(req, res, next, {
      state: {path: req.url},
      scope: ['read:user'],
    });
    return null;
  }
  return userAuth.accessToken;
}

export function handleAuthCallback() {
  return async (req: Request, res: Response, next: NextFunction) => {
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
  };
}
