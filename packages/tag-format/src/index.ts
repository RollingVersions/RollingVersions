import VersionNumber, {
  parseString,
  printString,
} from '@rollingversions/version-number';
import parseTemplate from './Template';
export interface PrintTagContext {
  packageName: string;
  oldTagName: string | null;
  versionSchema: readonly string[];
  tagFormat: string | undefined;
}
export function printTag(
  version: VersionNumber,
  {packageName, oldTagName, versionSchema, tagFormat}: PrintTagContext,
): string {
  if (tagFormat) {
    return parseTemplate(tagFormat).applyTemplate((variableName: string) => {
      if (variableName === 'PACKAGE_NAME') {
        return packageName;
      }
      const i = versionSchema.indexOf(variableName);
      if (i !== -1) {
        return version.numerical[i].toString(10);
      }
      throw new Error(`Unsupported variable: "${variableName}"`);
    });
  }

  let versionString = ``;
  if (!oldTagName || oldTagName.includes('@'))
    versionString += `${packageName}@`;
  if (oldTagName && oldTagName[versionString.length] === 'v')
    versionString += `v`;
  versionString += printString(version);
  return versionString;
}

export interface ParseTagContext {
  allowTagsWithoutPackageName: boolean;
  packageName: string;
  versionSchema: readonly string[];
  tagFormat: string | undefined;
}
export function parseTag(
  tagName: string,
  {
    allowTagsWithoutPackageName,
    packageName,
    versionSchema,
    tagFormat,
  }: {
    allowTagsWithoutPackageName: boolean;
    packageName: string;
    versionSchema: readonly string[];
    tagFormat: string | undefined;
  },
): VersionNumber | null {
  if (tagFormat) {
    const numerical = versionSchema.map(() => 0);
    const isValid = parseTemplate(tagFormat).parse(
      tagName,
      (variableName: string, str: string) => {
        if (variableName === 'PACKAGE_NAME') {
          return str.startsWith(packageName) ? packageName : null;
        }
        const i = versionSchema.indexOf(variableName);
        if (i !== -1) {
          const match = /^\d+/.exec(str);
          if (match) {
            numerical[i] = parseInt(match[0], 10);
            return match[0];
          }
        }
        throw new Error(`Unsupported variable: "${variableName}"`);
      },
    );
    if (isValid) {
      return {
        numerical,
        prerelease: [],
        build: [],
      };
    } else {
      return null;
    }
  }
  if (tagName.startsWith(`${packageName}@`)) {
    return parseString(tagName.substr(`${packageName}@`.length));
  }
  if (allowTagsWithoutPackageName) {
    return parseString(tagName);
  }
  return null;
}
