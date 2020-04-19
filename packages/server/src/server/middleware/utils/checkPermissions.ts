import {Response, Request} from 'express';
import {getGitHubAccessToken} from '../auth';
import getPermissionLevel, {
  Permission,
} from '../../permissions/getPermissionLevel';
import {parseParams} from './validateParams';
import log from '../../logger';

export {Permission};

const permisisonInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string; email: string | null}
>();
export function getPermission(req: Request) {
  return permisisonInfoMap.get(req)?.permission || 'none';
}
export function getUser(req: Request) {
  return {
    login: permisisonInfoMap.get(req)?.login || 'unknown',
    email: permisisonInfoMap.get(req)?.email,
  };
}
export default function checkPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const pullRequest = parseParams(req);
      const permissionInfo = await getPermissionLevel(pullRequest, userAuth);
      permisisonInfoMap.set(req, permissionInfo);
      if (!allowedPermissions.includes(permissionInfo.permission)) {
        log({
          status: 'warn',
          type: 'permission_denied',
          message: `${permissionInfo.login} does not have access to ${pullRequest.repo.owner}/${pullRequest.repo.name}#${pullRequest.number}`,
          reason: permissionInfo.reason,
          login: permissionInfo.login,
          email: permissionInfo.email,
          repo_owner: pullRequest.repo.owner,
          repo_name: pullRequest.repo.name,
          pull_number: pullRequest.number,
        });
        res
          .status(404)
          .send(
            'Either this PR does not exist, you do not have acess to it, or Rolling Versions is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}
