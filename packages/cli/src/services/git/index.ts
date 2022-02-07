import {readFile, writeFile, unlink} from 'fs';
import {resolve} from 'path';

import {spawnBuffered} from '../../utils/spawn';

export async function getCurrentBranchName(dirname: string) {
  const data = await spawnBuffered(
    'git',
    ['rev-parse', '--abbrev-ref', 'HEAD'],
    {
      cwd: dirname,
    },
  );
  return data.toString('utf8').trim();
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
    return await new Promise<string>((fulfill, reject) => {
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
  return await new Promise<void>((fulfill, reject) => {
    writeFile(resolve(dirname, filename), data, (err) => {
      if (err) reject(err);
      else fulfill();
    });
  });
}

export async function deleteRepoFile(dirname: string, filename: string) {
  return await new Promise<void>((fulfill, reject) => {
    unlink(resolve(dirname, filename), (err) => {
      if (err) reject(err);
      else fulfill();
    });
  });
}
