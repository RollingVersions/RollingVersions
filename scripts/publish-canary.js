const {resolve, join} = require('path');
const {readFileSync, writeFileSync} = require('fs');
const {spawn} = require('child_process');

const packagesDir = resolve(`${__dirname}/../packages`);

const VERSION = `${process.env.CIRCLE_BUILD_NUM}.0.0`;
const canaries = ['config', 'change-set', 'version-number', 'tag-format']
  .map((name) => ({
    dir: join(packagesDir, name),
    prod: `@rollingversions/${name}`,
    canary: `@rollingversions/${name}-canary`,
  }))
  .concat([
    {
      dir: join(packagesDir, 'cli'),
      prod: 'rollingversions',
      canary: '@rollingversions/canary',
    },
  ]);
const renames = new Map(canaries.map(({prod, canary}) => [prod, canary]));
function applyRenames(deps) {
  if (!deps) return;
  for (const original of Object.keys(deps)) {
    const renamed = renames.get(original);
    if (renamed) {
      delete deps[original];
      deps[renamed] = VERSION;
    }
  }
}
async function run() {
  for (const {dir, canary} of canaries) {
    const filename = `${dir}/package.json`;
    const original = readFileSync(filename, 'utf8');
    try {
      const pkg = JSON.parse(original);
      pkg.name = canary;
      pkg.version = VERSION;
      pkg.publishConfig = {access: 'public'};

      applyRenames(pkg.dependencies);
      applyRenames(pkg.devDependencies);
      applyRenames(pkg.peerDependencies);

      writeFileSync(filename, JSON.stringify(pkg));
      await new Promise((resolve, reject) => {
        spawn('npm', ['publish'], {
          cwd: dir,
          stdio: 'inherit',
        })
          .on('error', reject)
          .on('exit', resolve);
      });
    } finally {
      writeFileSync(filename, original);
    }
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
