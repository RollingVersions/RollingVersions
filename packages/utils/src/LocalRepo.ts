import {relative} from 'path';
import {statSync, readFileSync} from 'fs';
import globby from 'globby';
// import {graphql} from '@octokit/graphql';
import {PackageInfos, PackageInfo, Platform} from './Platforms';
import isObject from './utils/isObject';
import VersionTag from './VersionTag';
import addVersions from './utils/addVersions';
import {spawnBuffered} from './spawn';
import isTruthy from './utils/isTruthy';

async function listTags(
  dirname: string,
): Promise<Pick<VersionTag, 'commitSha' | 'name'>[]> {
  try {
    const data = await spawnBuffered('git', ['show-ref', '--tags', '-d'], {
      cwd: dirname,
    });
    const lines = data.toString('utf8').split('\n');
    const tags = new Map<string, Pick<VersionTag, 'commitSha' | 'name'>>();
    return lines
      .map((line): Pick<VersionTag, 'commitSha' | 'name'> | null => {
        const matchLine = /^([0-9a-f]+) +refs\/tags\/(.*)$/.exec(line);
        if (!matchLine) return null;
        const [, commitSha, name] = matchLine;
        const matchName = /^(.*)\^\{\}$/.exec(name);
        if (matchName) {
          if (tags.has(matchName[1])) {
            tags.get(matchName[1])!.commitSha = commitSha;
          }
          return null;
        }
        const result = {commitSha, name};
        tags.set(matchLine[2], result);
        return result;
      })
      .filter(isTruthy);
  } catch (ex) {
    if (ex.code === 'NON_ZERO_EXIT_CODE' && ex.status === 1) {
      // git show-ref exits with 1 if there are no tags
      return [];
    }
    throw ex;
  }
}

async function listRawPackages(dirname: string) {
  const packages = new Map<
    string,
    Array<Omit<PackageInfo, 'versionTag' | 'registryVersion'>>
  >();

  if (!statSync(dirname).isDirectory()) {
    throw new Error('Expected a valid directory');
  }
  const results = await globby(dirname, {
    gitignore: true,
    onlyFiles: true,
  });
  for (const entryPath of results) {
    if (entryPath.replace(/\\/g, '/').endsWith('/package.json')) {
      const content = readFileSync(entryPath, 'utf8');
      let result: unknown;
      try {
        result = JSON.parse(content);
      } catch (ex) {
        // ignore
      }
      if (isObject(result) && typeof result.name === 'string') {
        packages.set(result.name, packages.get(result.name) || []);
        packages.get(result.name)!.push({
          platform: Platform.npm,
          path: relative(dirname, entryPath).replace(/\\/g, '/'),
          publishConfigAccess:
            result.name[0] === '@'
              ? isObject(result.publishConfig) &&
                result.publishConfig.access === 'public'
                ? 'public'
                : 'restricted'
              : 'public',
          packageName: result.name,
          notToBePublished: result.private === true,
        });
      }
    }
  }

  return packages;
}

export async function listPackages(dirname: string): Promise<PackageInfos> {
  const [allTags, packages] = await Promise.all([
    listTags(dirname),
    listRawPackages(dirname),
  ]);

  return await addVersions(packages, allTags);
}

export async function getCommits(dirname: string, lastTag?: string) {
  const data = await spawnBuffered(
    'git',
    ['log', '--pretty=format:"%H"', lastTag ? `HEAD...${lastTag}` : `HEAD`],
    {
      cwd: dirname,
    },
  );
  return data
    .toString('utf8')
    .split('\n')
    .map((s) => s.trim())
    .map((s) => s.replace(/^\"([^"]+)\"$/, '$1'))
    .filter((s) => s !== '');
}

export async function getHeadSha(dirname: string) {
  const data = await spawnBuffered('git', ['rev-parse', 'HEAD'], {
    cwd: dirname,
  });
  return data.toString('utf8').trim();
}
