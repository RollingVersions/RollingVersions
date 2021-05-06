import type {Response, Request} from 'express';

import {expressLogger} from '../../logger';
import getPermissionLevel, {
  Permission,
  getRepoPermissionLevel,
} from '../../permissions/getPermissionLevel';
import {getGitHubAccessToken} from '../auth';
import {parseParams, parseRepoParams} from './validateParams';

export type {Permission};

const permissionInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string}
>();
export function getPermission(req: Request) {
  return permissionInfoMap.get(req)?.permission || 'none';
}
export interface User {
  login: string;
}
export function getUser(req: Request): User {
  const pi = permissionInfoMap.get(req) || repoPermissionInfoMap.get(req);
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
      permissionInfoMap.set(req, permissionInfo);
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
            'Either this PR does not exist, you do not have access to it, or Rolling Versions is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}

const repoPermissionInfoMap = new WeakMap<
  Request,
  {permission: Permission; login: string}
>();
export function getRepoPermission(req: Request) {
  return repoPermissionInfoMap.get(req)?.permission || 'none';
}
export function checkRepoPermissions(allowedPermissions: Permission[]) {
  return async (req: Request, res: Response, next: (err?: any) => void) => {
    try {
      const userAuth = getGitHubAccessToken(req, res);
      const repo = parseRepoParams(req);
      const logger = expressLogger(req, res);
      const timer = logger.withTimer();
      const permissionInfo = await getRepoPermissionLevel(
        {owner: repo.owner, name: repo.repo},
        userAuth,
        logger,
      );
      timer.info('loaded_permission_level', 'Loaded permission level', {
        allowed_permissions: allowedPermissions,
        permission: permissionInfo.permission,
        reason: permissionInfo.reason,
        login: permissionInfo.login,
        repo_owner: repo.owner,
        repo_name: repo.repo,
      });
      repoPermissionInfoMap.set(req, permissionInfo);
      if (!allowedPermissions.includes(permissionInfo.permission)) {
        logger.warning(
          'permission_denied',
          `${permissionInfo.login} does not have access to ${repo.owner}/${repo.repo}`,
          {
            allowed_permissions: allowedPermissions,
            permission: permissionInfo.permission,
            reason: permissionInfo.reason,
            login: permissionInfo.login,
            repo_owner: repo.owner,
            repo_name: repo.repo,
          },
        );
        res
          .status(404)
          .send(
            'Either this repository does not exist, you do not have access to it, or Rolling Versions is not installed on this repository.',
          );
      } else {
        next();
      }
    } catch (ex) {
      next(ex || new Error('Permissions check failed'));
    }
  };
}
