import {resolve, dirname} from 'path';
import {gt, prerelease} from 'semver';
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
async function parseNPM(result: Promise<Buffer>) {
  return result.then(
    (buffer) => {
      try {
        return {
          ok: true as const,
          value: JSON.parse(buffer.toString('utf8')),
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
): Promise<Record<string, 'admin' | 'owner' | 'developer'>> {
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
  } catch (ex) {
    return {authenticated: false, message: ex.message};
  }
}

export async function getPackument(
  packageName: string,
): Promise<{
  versions: Set<string>;
  maintainers: {name: string; email?: string}[];
} | null> {
  const result = await parseNPM(
    spawnBuffered('npm', ['view', packageName, '--json'], {}),
  );
  if (!result.ok) {
    if (result.code === 'E404') {
      return null;
    }
    throw npmError(result);
  }
  const p = result.value;
  return {
    versions: new Set(p.versions),
    maintainers: (p.maintainers || []).map((m: string) => {
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
  };
}

export async function getNpmVersion(packageName: string) {
  const result = await parseNPM(
    spawnBuffered('npm', ['view', packageName, '--json'], {}),
  );
  if (!result.ok) {
    if (result.code === 'E404') {
      return null;
    }
    throw npmError(result);
  }
  const p = result.value;

  return (p.versions as string[]).reduce<string>((a, b) => {
    if (!prerelease(b) && gt(b, a)) {
      return b;
    }
    return a;
  }, p['dist-tags'].latest);
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
