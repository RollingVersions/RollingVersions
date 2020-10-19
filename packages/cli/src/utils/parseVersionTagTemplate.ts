import assert from 'assert';

export interface Version {
  PACKAGE_NAME: string;
  MAJOR: string;
  MINOR: string;
  PATCH: string;
}
function isValidVariable(
  variable: string,
): variable is 'PACKAGE_NAME' | 'MAJOR' | 'MINOR' | 'PATCH' {
  switch (variable) {
    case 'PACKAGE_NAME':
    case 'MAJOR':
    case 'MINOR':
    case 'PATCH':
      return true;
    default:
      return false;
  }
}
export default function parseVersionTagTemplate(str: string) {
  const variables = [];
  const printer: ((values: Version) => string)[] = [];
  const parser: ((
    str: string,
    packageName: string,
  ) => null | {rest: string; parsed: Partial<Version>})[] = [];
  let inVariables = false;
  for (const part of str.split('{{')) {
    if (inVariables) {
      const split = part.split('}}');
      if (split.length !== 2) {
        throw new Error(`Mismatched parentheses: ${str}`);
      }
      const [placeholder, plainString] = split;

      const [variable, ...filters] = placeholder
        .split('|')
        .map((str) => str.trim());

      if (!isValidVariable(variable)) {
        throw new Error(`${variable} is not a valid variable: ${str}`);
      }
      for (const filter of filters) {
        const [filterName, ...params] = filter
          .split(' ')
          .filter((v) => v.trim());
        switch (filterName) {
          case 'pad-number':
            assert(
              params.length === 1,
              `The ${filterName} filter requires a value for the required length: ${str}`,
            );
            assert(
              /^[0-9]+$/.test(params[0]),
              `The parameter for the ${filterName} fitler must be an integer: ${str}`,
            );
            break;
          default:
            throw new Error(
              `Unrecognized filter in version format, "${filter}" in: ${str}`,
            );
        }
      }

      variables.push(variable);

      printer.push((version) => {
        return filters.reduce<string>((value, filter): string => {
          const [filterName, ...params] = filter
            .split(' ')
            .filter((v) => v.trim());
          switch (filterName) {
            case 'pad-number':
              return value.padStart(parseInt(params[0], 10), '0');
            default:
              throw new Error(
                `Unrecognized filter in version format, "${filter}" in: ${str}`,
              );
          }
        }, version[variable]);
      });
      parser.push((str, packageName) => {
        switch (variable) {
          case 'PACKAGE_NAME':
            return str.startsWith(packageName)
              ? {
                  rest: str.substring(packageName.length),
                  parsed: {PACKAGE_NAME: packageName},
                }
              : null;
          case 'MAJOR':
          case 'MINOR':
          case 'PATCH':
            const match = /^\d+/.exec(str);
            return match
              ? {
                  rest: str.substring(match[0].length),
                  parsed: {[variable]: match[0]},
                }
              : null;
        }
      });
      printer.push(() => plainString);
      parser.push((str) =>
        str.startsWith(plainString)
          ? {rest: str.substring(plainString.length), parsed: {}}
          : null,
      );
    } else {
      inVariables = true;
      printer.push(() => part);
      parser.push((str) =>
        str.startsWith(part)
          ? {rest: str.substring(part.length), parsed: {}}
          : null,
      );
    }
  }

  return {
    variables,
    parse: (tag: string, packageName: string) => {
      let rest = tag;
      const result: Partial<Version> = {};
      for (const part of parser) {
        const partResult = part(rest, packageName);
        if (!partResult) return partResult;
        rest = partResult.rest;
        Object.assign(result, partResult.parsed);
      }
      if (rest) return null;
      return result;
    },
    applyTemplate: (value: Version) => printer.map((r) => r(value)).join(''),
  };
}
