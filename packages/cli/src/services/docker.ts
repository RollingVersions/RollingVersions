import {spawnBuffered} from 'modern-spawn';

export async function getLocalImages() {
  const jsonLines = await spawnBuffered(`docker`, [
    'image',
    'ls',
    '--format',
    '{{json .}}',
  ]).getResult(`utf8`);

  return jsonLines
    .split('\n')
    .filter(Boolean)
    .map((v) => {
      try {
        return JSON.parse(v);
      } catch (ex) {
        return null;
      }
    })
    .filter(Boolean)
    .map((v): {name: string; tag: string; createdAt: Date} => ({
      name: v.Repository,
      tag: v.Tag,
      createdAt: new Date(
        `${v.CreatedAt.split(' ')[0]}T${v.CreatedAt.split(' ')[1]}`,
      ),
    }));
}

export async function pushImage(local: string, remote: string) {
  if (local !== remote) {
    await spawnBuffered(`docker`, ['tag', local, remote], {
      debug: true,
    }).getResult();
  }
  await spawnBuffered(`docker`, ['push', remote], {debug: true}).getResult();
}
