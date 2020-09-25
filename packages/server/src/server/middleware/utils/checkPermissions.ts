import {Response, Request} from 'express';
import {getGitHubAccessToken} from '../auth';
import getPermissionLevel, {
  Permission,
  getRepoPermissionLevel,
} from '../../permissions/getPermissionLevel';
import {parseParams, parseRepoParams} from './validateParams';
import {expressLogger} from '../../logger';

export {Permission};

const permisisonInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string}
>();
export function getPermission(req: Request) {
  return permisisonInfoMap.get(req)?.permission || 'none';
}
export interface User {
  login: string;
}
export function getUser(req: Request): User {
  const pi = permisisonInfoMap.get(req) || repoPermisisonInfoMap.get(req);
  return {
    login: pi?.login || 'unknown',
  };
}
export default function checkPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const pullRequest = parseParams(req);

      const logger = expressLogger(req, res);
      const timer = logger.withTimer();
      const permissionInfo = await getPermissionLevel(
        pullRequest,
        userAuth,
        logger,
      );
      timer.info('loaded_permission_level', 'Loaded permission level', {
        allowed_permissions: allowedPermissions,
        permission: permissionInfo.permission,
        reason: permissionInfo.reason,
        login: permissionInfo.login,
        repo_owner: pullRequest.repo.owner,
        repo_name: pullRequest.repo.name,
        pull_number: pullRequest.number,
      });
      permisisonInfoMap.set(req, permissionInfo);
      if (!allowedPermissions.includes(permissionInfo.permission)) {
        logger.warning(
          'permission_denied',
          `${permissionInfo.login} does not have access to ${pullRequest.repo.owner}/${pullRequest.repo.name}#${pullRequest.number}`,
          {
            allowed_permissions: allowedPermissions,
            permission: permissionInfo.permission,
            reason: permissionInfo.reason,
            login: permissionInfo.login,
            repo_owner: pullRequest.repo.owner,
            repo_name: pullRequest.repo.name,
            pull_number: pullRequest.number,
          },
        );
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

const repoPermisisonInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string}
>();
export function getRepoPermission(req: Request) {
  return repoPermisisonInfoMap.get(req)?.permission || 'none';
}
export function checkRepoPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const repo = parseRepoParams(req);
      const logger = expressLogger(req, res);
      const timer = logger.withTimer();
      const permissionInfo = await getRepoPermissionLevel(
        repo,
        userAuth,
        logger,
      );
      timer.info('loaded_permission_level', 'Loaded permission level', {
        allowed_permissions: allowedPermissions,
        permission: permissionInfo.permission,
        reason: permissionInfo.reason,
        login: permissionInfo.login,
        repo_owner: repo.owner,
        repo_name: repo.name,
      });
      repoPermisisonInfoMap.set(req, permissionInfo);
      if (!allowedPermissions.includes(permissionInfo.permission)) {
        logger.warning(
          'permission_denied',
          `${permissionInfo.login} does not have access to ${repo.owner}/${repo.name}`,
          {
            allowed_permissions: allowedPermissions,
            permission: permissionInfo.permission,
            reason: permissionInfo.reason,
            login: permissionInfo.login,
            repo_owner: repo.owner,
            repo_name: repo.name,
          },
        );
        res
          .status(404)
          .send(
            'Either this repository does not exist, you do not have acess to it, or Rolling Versions is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}
