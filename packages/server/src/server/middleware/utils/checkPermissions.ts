import {Response, Request} from 'express';
import {getGitHubAccessToken} from '../auth';
import getPermissionLevel, {
  Permission,
} from '../../permissions/getPermissionLevel';
import {parseParams} from './validateParams';

export {Permission};
export default function checkPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const pullRequest = parseParams(req);
      const permission = await getPermissionLevel(pullRequest, userAuth);
      if (!allowedPermissions.includes(permission)) {
        res
          .status(404)
          .send(
            'Either this PR does not exist, you do not have acess to it, or Changelog Version is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}
