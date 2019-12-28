import {packument} from 'pacote';
import {gt, prerelease} from 'semver';
const readConfig = require('libnpmconfig').read;
// Could use libnpmpublish to publish, but probably best to just use CLI

export async function getNpmVersion(packageName: string) {
  const config = {
    ...readConfig().toJSON(),
    cache: null,
  };
  try {
    const pkg = await packument(packageName, config);
    const latest = pkg['dist-tags'].latest;
    return Object.values(pkg.versions)
      .map((v) => v.version)
      .reduce((a, b) => {
        if (!prerelease(b) && gt(b, a)) {
          return b;
        }
        return a;
      }, latest);
  } catch (ex) {
    if (ex.statusCode === 404) {
      return null;
    }
    throw ex;
  }
}
