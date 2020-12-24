const {resolve, join} = require('path');
const {readdirSync, mkdirSync, readFileSync, writeFileSync} = require('fs');

const packageDirectory = resolve(`${__dirname}/../packages/db`);
let filenames = [];
try {
  filenames = readdirSync(join(packageDirectory, `src/__generated__`));
} catch (ex) {
  if (ex.code === 'ENOENT') {
    filenames = readdirSync(join(packageDirectory, `lib/__generated__`));
  } else {
    throw ex;
  }
}

const names = filenames
  .filter((filename) => filename.endsWith('.ts'))
  .map((filename) => filename.replace(/(\.d)?\.ts$/, ''))
  .filter((name) => name !== 'index');
const namesSet = new Set(names);

readdirSync(packageDirectory)
  .filter((name) => !namesSet.has(name))
  .forEach((name) => {
    try {
      readFileSync(join(packageDirectory, name, 'package.json'));
    } catch (ex) {
      return;
    }
    console.warn(`DELETE: ${join(packageDirectory, name)}`);
    require('rimraf').sync(join(packageDirectory, name));
  });

names.forEach((name) => {
  const output = join(packageDirectory, name);
  try {
    mkdirSync(output);
  } catch (ex) {
    if (ex.code !== 'EEXIST') {
      throw ex;
    }
  }
  const content = `${JSON.stringify(
    {
      main: `../lib/__generated__/${name}.js`,
      types: `../lib/__generated__/${name}.d.ts`,
    },
    null,
    '  ',
  )}\n`;
  try {
    if (content === readFileSync(join(output, 'package.json'), 'utf8')) {
      return;
    }
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
  }
  console.info(`WRITE: ${join(output, 'package.json')}`);
  writeFileSync(join(output, 'package.json'), content);
});
