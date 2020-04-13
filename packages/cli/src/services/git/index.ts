import {relative, resolve} from 'path';
import {statSync, readFile, writeFile} from 'fs';
import globby from 'globby';

import isTruthy from '../../ts-utils/isTruthy';
import {spawnBuffered} from '../../utils/spawn';

export async function getAllTags(
  dirname: string,
): Promise<{commitSha: string; name: string}[]> {
  try {
    const data = await spawnBuffered('git', ['show-ref', '--tags', '-d'], {
      cwd: dirname,
    });
    const lines = data.toString('utf8').split('\n');
    const tags = new Map<string, {commitSha: string; name: string}>();
    return lines
      .map((line): Pick<
        {commitSha: string; name: string},
        'commitSha' | 'name'
      > | null => {
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

export async function* getAllFiles(dirname: string) {
  if (!statSync(dirname).isDirectory()) {
    throw new Error('Expected a valid directory');
  }

  const results = await globby(dirname, {
    gitignore: true,
    onlyFiles: true,
  });

  for (const entryPath of results) {
    yield {
      path: relative(dirname, entryPath).replace(/\\/g, '/'),
      getContents: async () =>
        new Promise<string>((resolve, reject) => {
          readFile(entryPath, 'utf8', (err, res) => {
            if (err) reject(err);
            else resolve(res);
          });
        }),
    };
  }
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
    .filter(isTruthy);
}

export async function getHeadSha(dirname: string) {
  const data = await spawnBuffered('git', ['rev-parse', 'HEAD'], {
    cwd: dirname,
  });
  return data.toString('utf8').trim();
}

export async function readRepoFile(
  dirname: string,
  filename: string,
): Promise<Buffer>;
export async function readRepoFile(
  dirname: string,
  filename: string,
  encoding: 'utf8',
): Promise<string>;
export async function readRepoFile(
  dirname: string,
  filename: string,
  encoding?: 'utf8',
) {
  if (encoding) {
    return new Promise<string>((fulfill, reject) => {
      readFile(resolve(dirname, filename), encoding, (err, res) => {
        if (err) reject(err);
        else fulfill(res);
      });
    });
  } else {
    return new Promise<Buffer>((fulfill, reject) => {
      readFile(resolve(dirname, filename), (err, res) => {
        if (err) reject(err);
        else fulfill(res);
      });
    });
  }
}

export async function writeRepoFile(
  dirname: string,
  filename: string,
  data: Buffer | string,
) {
  return new Promise<void>((fulfill, reject) => {
    writeFile(resolve(dirname, filename), data, (err) => {
      if (err) reject(err);
      else fulfill();
    });
  });
}
