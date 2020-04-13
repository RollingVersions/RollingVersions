import {resolve, dirname} from 'path';
import {packument} from 'pacote';
import {gt, prerelease} from 'semver';
import {spawnBuffered} from '../../utils/spawn';
const readConfig = require('libnpmconfig').read;
const profile = require('npm-profile');
const org = require('libnpmorg');

// Could use libnpmpublish to publish, but probably best to just use CLI

export async function getOrgRoster(
  name: string,
): Promise<Record<string, 'admin' | 'owner' | 'developer'>> {
  const config = {
    ...readConfig().toJSON(),
    cache: null,
  };
  const roster = await org.ls(name, config);
  return roster;
}
export async function getProfile(): Promise<
  | {
      authenticated: true;
      profile: {
        name: string;
        email: string;
        tfaOnPublish: boolean;
      };
    }
  | {authenticated: false; message: string}
> {
  try {
    const config = {
      ...readConfig().toJSON(),
      cache: null,
    };
    const p = await profile.get(config);
    return {
      authenticated: true,
      profile: {
        name: p.name,
        email: p.email,
        tfaOnPublish: p.tfa && p.tfa.mode !== 'auth-only',
      },
    };
  } catch (ex) {
    return {authenticated: false, message: ex.message};
  }
}

export async function getPackument(
  packageName: string,
  fullMetadata: true,
): Promise<{
  versions: Set<string>;
  maintainers: {name: string; email?: string}[];
} | null>;
export async function getPackument(
  packageName: string,
  fullMetadata?: boolean,
): Promise<{
  versions: Set<string>;
  maintainers?: {name: string; email?: string}[];
} | null>;
export async function getPackument(
  packageName: string,
  fullMetadata: boolean = false,
): Promise<{
  versions: Set<string>;
  maintainers?: {name: string; email?: string}[];
} | null> {
  const config = {
    ...readConfig().toJSON(),
    cache: null,
    fullMetadata,
  };
  try {
    const pk = await packument(packageName, config);
    if (!pk) return null;

    if (fullMetadata) {
      return {
        maintainers: pk.maintainers || [],
        versions: new Set(Object.keys(pk.versions)),
      };
    } else {
      return {
        versions: new Set(Object.keys(pk.versions)),
      };
    }
  } catch (ex) {
    if (ex.statusCode === 404) {
      return null;
    }
    throw ex;
  }
}

export async function getNpmVersion(packageName: string) {
  const config = {
    ...readConfig().toJSON(),
    cache: null,
  };
  try {
    const pkg = await packument(packageName, config);
    const latest = pkg['dist-tags'].latest;
    return Object.values(pkg.versions)
      .map((v) => v.version)
      .reduce((a, b) => {
        if (!prerelease(b) && gt(b, a)) {
          return b;
        }
        return a;
      }, latest);
  } catch (ex) {
    if (ex.statusCode === 404) {
      return null;
    }
    throw ex;
  }
}

export async function publish(
  repoDirname: string,
  path: string,
  dryRun: boolean = false,
) {
  await spawnBuffered('npm', ['publish', ...(dryRun ? ['--dry-run'] : [])], {
    cwd: dirname(resolve(repoDirname, path)),
  });
}
