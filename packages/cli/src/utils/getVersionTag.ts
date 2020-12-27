import {valid, prerelease, gt} from 'semver';
import isTruthy from '../ts-utils/isTruthy';
import parseVersionTagTemplate from './parseVersionTagTemplate';

export default function getVersionTag<Tag extends {readonly name: string}>(
  allTags: readonly Tag[],
  packageName: string,
  {
    repoHasMultiplePackages,
    tagFormat,
  }: {repoHasMultiplePackages: boolean; tagFormat: string | null},
): (Tag & {version: string}) | null {
  const format = tagFormat && parseVersionTagTemplate(tagFormat);
  const tags = allTags
    .map((tag) => {
      if (format) {
        const parsed = format.parse(tag.name, packageName);
        if (parsed) {
          return {
            ...tag,
            version: `${parseInt(parsed.MAJOR || '0', 10)}.${parseInt(
              parsed.MINOR || '0',
              10,
            )}.${parseInt(parsed.PATCH || '0', 10)}`,
          };
        } else {
          return null;
        }
      }
      if (!repoHasMultiplePackages && valid(tag.name.replace(/^v/, ''))) {
        return {
          ...tag,
          version: tag.name.replace(/^v/, ''),
        };
      }
      const split = tag.name.split('@');
      const version = split.pop();
      const name = split.join('@');
      if (name === packageName && version && valid(version.replace(/^v/, ''))) {
        return {...tag, version: version.replace(/^v/, '')};
      }
      return null;
    })
    .filter(isTruthy);

  const nonPrerelease = tags.filter((t) => !prerelease(t.version));
  if (nonPrerelease.length) {
    return nonPrerelease.reduce((a, b) => {
      if (gt(a.version, b.version)) {
        return a;
      } else {
        return b;
      }
    });
  } else {
    return null;
  }
}
