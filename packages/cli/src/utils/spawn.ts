// TODO: replace with execa if possible

import type {ChildProcess, SpawnOptionsWithoutStdio} from 'child_process';
import {spawn} from 'child_process';
import type {Readable} from 'stream';

async function getBuffer(stream: Readable) {
  const result: Buffer[] = [];
  await new Promise((resolve, reject) => {
    stream.on('data', (d) => result.push(d));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return Buffer.concat(result);
}
async function getStatusCode(cp: ChildProcess) {
  return await new Promise<number | null>((resolve, reject) => {
    cp.on('error', reject);
    cp.on('exit', (v) => resolve(v));
  });
}
export async function spawnBuffered(
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio,
) {
  const childProcess = spawn(command, args, options);
  const [stdout, stderr, status] = await Promise.all<
    Buffer,
    Buffer,
    number | null
  >([
    getBuffer(childProcess.stdout),
    getBuffer(childProcess.stderr),
    getStatusCode(childProcess),
  ]);
  if (status !== 0) {
    const err: any = new Error(
      `${[command, ...args]
        .map((arg) =>
          arg.includes(' ')
            ? arg.includes('"')
              ? `'${arg}'`
              : `"${arg}"`
            : arg,
        )
        .join(' ')} exited with code ${status}:\n${stderr.toString('utf8')}`,
    );
    err.code = 'NON_ZERO_EXIT_CODE';
    err.status = status;
    err.stdout = stdout;
    err.stderr = stderr;
    err.command = command;
    err.args = args;
    err.options = options;
    throw err;
  }
  return stdout;
}
