import {valid, prerelease, gt} from 'semver';
import VersionTag from '../VersionTag';

export default function getVersionTag(
  allTags: readonly Pick<VersionTag, 'commitSha' | 'name'>[],
  packageName: string,
  registryVersion: string | null,
  {isMonoRepo}: {isMonoRepo: boolean},
): VersionTag | null {
  const tags = allTags
    .map((tag) => {
      if (!isMonoRepo && valid(tag.name.replace(/^v/, ''))) {
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
    .filter(<T>(v: T): v is Exclude<T, null> => v !== null);
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
