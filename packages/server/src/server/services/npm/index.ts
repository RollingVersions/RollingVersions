import {gt, prerelease} from 'semver';
import {Logger} from '../../logger';
const fetch: typeof window['fetch'] = require('make-fetch-happen');

const baseURL = new URL('https://registry.npmjs.org');

export async function getNpmVersion(packageName: string, logger: Logger) {
  return await logger.withLogging(
    async () => {
      const url = new URL(`/${packageName}`, baseURL);
      if (url.origin !== baseURL.origin) {
        throw new Error('Invalid package name');
      }
      const response = await fetch(url.href, {});
      const body = await response.json();
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        if (body.error) {
          throw new Error(`npm error: ${body.error}`);
        } else {
          throw new Error(`npm error: ${JSON.stringify(body)}`);
        }
      }

      const versions = Object.keys(body.versions).filter((v) => !prerelease(v));

      if (!versions.length) return null;

      return versions.reduce((a, b) => {
        if (gt(b, a)) {
          return b;
        }
        return a;
      });
    },
    {
      success: 'got_package_version',
      successMessage: 'Got package version',
      failure: 'failed_get_package_version',
    },
  );
}
