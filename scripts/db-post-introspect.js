const {resolve, join} = require('path');
const {readdirSync, mkdirSync, readFileSync, writeFileSync} = require('fs');

let names = [];
try {
  names = readdirSync(`${__dirname}/../packages/db/src/__generated__`);
} catch (ex) {
  if (ex.code === 'ENOENT') {
    names = readdirSync(`${__dirname}/../packages/db/lib/__generated__`);
  } else {
    throw ex;
  }
}
names.forEach((filename) => {
  if (filename.endsWith('.ts') && filename !== 'index.ts') {
    const name = filename.replace(/\.ts$/, '');
    const output = resolve(`${__dirname}/../packages/db/${name}`);
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
    writeFileSync(join(output, 'package.json'), content);
  }
});
