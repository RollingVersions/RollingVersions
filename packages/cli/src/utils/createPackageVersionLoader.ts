import {gt} from 'semver';
import isTruthy from '../ts-utils/isTruthy';
import VersionTagTemplate, {getDefaultTagTemplte} from './VersionTagTemplate';

export interface PackageVersionLoaderConfig<TPackage, TTag> {
  packageCount: number;
  tags: TTag[];

  getTagName: (tag: TTag) => string;
  getPackageName: (pkg: TPackage) => string;
  getTagTemplate: (pkg: TPackage) => VersionTagTemplate | null;
}

export type VersionTag<TTag> = {
  versionString: string;
  version: {
    major: number | null;
    minor: number | null;
    patch: number | null;
  };
  tag: TTag;
};
export default function createPackageVersionLoader<TPackage, TTag>(
  config: PackageVersionLoaderConfig<TPackage, TTag>,
) {
  const defaultTagTemplate = getDefaultTagTemplte({
    tagNames: config.tags.map((t) => config.getTagName(t)),
    packageCount: config.packageCount,
  });

  const cache = new Map<string, VersionTag<TTag>[]>();

  // return package versions sorted from highest version number to lowest version number
  const getVersionsUncached = (
    pkg: TPackage,
    pkgName: string,
  ): VersionTag<TTag>[] => {
    const format = config.getTagTemplate(pkg) ?? defaultTagTemplate;
    return config.tags
      .map((tag) => {
        const tagName = config.getTagName(tag);
        const parsed = format.parse(tagName, pkgName);
        if (parsed) {
          const version = {
            major:
              parsed.MAJOR === undefined ? null : parseInt(parsed.MAJOR, 10),
            minor:
              parsed.MINOR === undefined ? null : parseInt(parsed.MINOR, 10),
            patch:
              parsed.PATCH === undefined ? null : parseInt(parsed.PATCH, 10),
          };
          return {
            versionString: [version.major, version.minor, version.patch]
              .map((v) => (v ?? 0).toString(10))
              .join('.'),
            version,
            tag,
          };
        } else {
          return null;
        }
      })
      .filter(isTruthy)
      .sort((a, b) => (gt(a.versionString, b.versionString) ? -1 : 1));
  };

  return {
    getVersionTagsForPackage: (pkg: TPackage) => {
      const packageName = config.getPackageName(pkg);
      const cached = cache.get(packageName);
      if (cached) return cached;
      const fresh = getVersionsUncached(pkg, packageName);
      cache.set(packageName, fresh);
      return fresh;
    },
    getNextTagForPackage: (pkg: TPackage, newVersion: string) => {
      const format = config.getTagTemplate(pkg) ?? defaultTagTemplate;
      const [MAJOR, MINOR, PATCH] = newVersion.split('.');
      return format.applyTemplate({
        PACKAGE_NAME: config.getPackageName(pkg),
        MAJOR,
        MINOR,
        PATCH,
      });
    },
  };
}
