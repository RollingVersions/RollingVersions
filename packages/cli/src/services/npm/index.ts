import {resolve, dirname} from 'path';

import {spawnBuffered} from '../../utils/spawn';

// Could use libnpmpublish to publish, but probably best to just use CLI

function tryJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (ex) {
    return null;
  }
}
function npmError(err: {code: string; summary: string; detail: string}) {
  const e: any = new Error(err.summary);
  e.code = err.code;
  e.summary = err.summary;
  e.detail = err.detail;
  return e;
}
async function parseNPM<T = any>(
  result: Promise<Buffer>,
  parseSuccess: (str: string) => T = (v) => JSON.parse(v),
) {
  return result.then(
    (buffer) => {
      try {
        return {
          ok: true as const,
          value: parseSuccess(buffer.toString('utf8')),
        };
      } catch (ex) {
        return {
          ok: false as const,
          code: 'JSONPARSEFAIL' as const,
          summary: 'Unable to parse the response from npm as JSON',
          detail: buffer.toString('utf8'),
        };
      }
    },
    (ex) => {
      if (ex.stdout) {
        const parsed = tryJsonParse(ex.stdout.toString('utf8'));
        if (parsed?.error) {
          const {error} = parsed;
          const code: unknown = error.code;
          const summary: string = error.summary;
          const detail: string = error.detail;
          switch (code) {
            case 'E404':
            case 'ENEEDAUTH':
              return {
                ok: false as const,
                code,
                summary,
                detail,
              };
          }
          if (summary) {
            throw npmError(error);
          }
        }
      }
      throw ex;
    },
  );
}
export async function getOrgRoster(
  orgName: string,
): Promise<Partial<Record<string, 'admin' | 'owner' | 'developer'>>> {
  const result = await parseNPM(
    spawnBuffered('npm', ['org', 'ls', orgName, '--json'], {}),
  );
  if (!result.ok) {
    throw npmError(result);
  }
  return result.value;
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
    const result = await parseNPM(
      spawnBuffered('npm', ['profile', 'get', '--json'], {}),
    );
    if (!result.ok) return {authenticated: false, message: result.summary};
    return {
      authenticated: true,
      profile: {
        name: result.value.name,
        email: result.value.email,
        tfaOnPublish: !!(
          result.value.tfa && result.value.tfa.mode !== 'auth-only'
        ),
      },
    };
  } catch (ex: any) {
    return {authenticated: false, message: ex.message};
  }
}

export async function getVersions(
  repoDirname: string,
  path: string,
): Promise<Set<string> | null> {
  const result = await parseNPM(
    spawnBuffered('npm', ['view', '--json'], {
      cwd: dirname(resolve(repoDirname, path)),
    }),
  );
  if (!result.ok) {
    if (result.code === 'E404') {
      return null;
    }
    throw npmError(result);
  }
  const p = result.value;
  return new Set(p.versions);
}

export async function getOwners(
  packageName: string,
): Promise<{name: string; email?: string}[] | null> {
  const result = await parseNPM(
    spawnBuffered('npm', ['owner', 'ls', packageName, '--json'], {}),
    (str) =>
      str
        .split('\n')
        .filter(Boolean)
        .map((m: string) => {
          const [username, ...emailish] = m.split(' ');
          return {
            name: username,
            email:
              emailish
                .join(' ')
                .trim()
                .replace(/^\<(.*)\>$/, '$1')
                .trim() || undefined,
          };
        }),
  );
  if (!result.ok) {
    if (result.code === 'E404') {
      return null;
    }
    throw npmError(result);
  }
  return result.value;
}

export async function publish(
  repoDirname: string,
  path: string,
  {dryRun, canary}: {dryRun: boolean; canary: boolean},
) {
  await spawnBuffered(
    'npm',
    [
      'publish',
      ...(canary ? ['--tag', 'canary'] : []),
      ...(dryRun ? ['--dry-run'] : []),
    ],
    {
      cwd: dirname(resolve(repoDirname, path)),
    },
  );
}
