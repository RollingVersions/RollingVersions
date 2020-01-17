import {listPackages} from 'changelogversion-utils/lib/LocalRepo';

async function run() {
  const packages = await listPackages(process.cwd());
  console.info(packages);
}

run().catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});
