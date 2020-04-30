import {relative, resolve} from 'path';
import {statSync, readFile, writeFile} from 'fs';
import globby from 'globby';

import {spawnBuffered} from '../../utils/spawn';

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
