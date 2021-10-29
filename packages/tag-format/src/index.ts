import {DEFAULT_VERSION_SCHEMA} from '@rollingversions/config';
import type {VersionNumber, VersionSchema} from '@rollingversions/types';
import {parseString, printString} from '@rollingversions/version-number';

import parseTemplate from './Template';

export interface PrintTagContext {
  packageName: string;
  oldTagName: string | null;
  versionSchema?: VersionSchema;
  tagFormat?: string;
}
export function printTag(
  version: VersionNumber,
  {
    packageName,
    oldTagName,
    versionSchema = DEFAULT_VERSION_SCHEMA,
    tagFormat,
  }: PrintTagContext,
): string {
  if (tagFormat) {
    return parseTemplate(tagFormat).print((variableName: string) => {
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
  versionSchema?: VersionSchema;
  tagFormat?: string;
}
export function parseTag(
  tagName: string,
  {
    allowTagsWithoutPackageName,
    packageName,
    versionSchema = DEFAULT_VERSION_SCHEMA,
    tagFormat,
  }: ParseTagContext,
): VersionNumber | null {
  if (tagFormat) {
    const numerical = versionSchema.map(() => 0);
    const values = parseTemplate(tagFormat).parse<[string, number]>(
      tagName,
      (state, variableName) => {
        if (variableName === 'PACKAGE_NAME') {
          if (!state.rest.startsWith(packageName)) return null;

          state.rest = state.rest.substr(packageName.length);

          return state;
        } else {
          const match = /^\d+/.exec(state.rest);
          if (!match) return null;

          state.values.push([variableName, parseInt(match[0], 10)]);
          state.rest = state.rest.substr(match[0].length);

          return state;
        }
      },
    );
    if (values) {
      for (const [variableName, value] of values) {
        const i = versionSchema.indexOf(variableName);
        if (i === -1) {
          throw new Error(`Unsupported variable: "${variableName}"`);
        }
        numerical[i] = value;
      }
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
