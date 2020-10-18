import {valid, prerelease, gt} from 'semver';
import isTruthy from '../ts-utils/isTruthy';
import parseVersionTagTemplate from './parseVersionTagTemplate';

export default function getVersionTag<Tag extends {readonly name: string}>(
  allTags: readonly Tag[],
  packageName: string,
  registryVersion: string | null,
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
            version: `${parsed.MAJOR || 0}.${parsed.MINOR ||
              0}.${parsed.PATCH || 0}`,
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

  if (registryVersion) {
    return tags.find((t) => t.version === registryVersion) || null;
  } else if (tags.some((t) => !prerelease(t.version))) {
    return tags
      .filter((t) => !prerelease(t.version))
      .reduce((a, b) => {
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
