const {readFileSync, writeFileSync} = require('fs');
const {spawn} = require('child_process');

async function run() {
  const filename = `${__dirname}/packages/cli/package.json`;
  const original = readFileSync(filename, 'utf8');
  try {
    const pkg = JSON.parse(original);
    pkg.name = '@rollingversions/canary';
    pkg.version = `${process.env.CIRCLE_BUILD_NUM}.0.0`;
    pkg.publishConfig = {access: 'public'};
    writeFileSync(filename, JSON.stringify(pkg));
    return await new Promise((resolve, reject) => {
      spawn('npm', ['publish'], {
        cwd: `${__dirname}/packages/cli`,
        stdio: 'inherit',
      })
        .on('error', reject)
        .on('exit', resolve);
    });
  } finally {
    writeFileSync(filename, original);
  }
}

run().then(
  (status) => {
    process.exit(status);
  },
  (ex) => {
    console.error(ex.stack);
    process.exit(1);
  },
);
