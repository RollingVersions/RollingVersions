import assert from 'assert';

interface Template {
  variables: string[];
  parse: (
    tag: string,
    matchVersionPart: (variableName: string, str: string) => string | null,
  ) => boolean;
  applyTemplate: (getVersionPart: (id: string) => string) => string;
}

function parseVersionTagTemplateUncached(str: string) {
  const variables = [];
  const printer: ((getVersionPart: (id: string) => string) => string)[] = [];
  const parser: ((
    str: string,
    matchVersionPart: (variableName: string, str: string) => string | null,
  ) => null | string)[] = [];
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

      printer.push((getVersionPart) => {
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
        }, getVersionPart(variable));
      });
      parser.push((str, matchVersionPart) => {
        const match = matchVersionPart(variable, str);
        if (match) {
          return str.substr(match.length);
        } else {
          return null;
        }
      });
      if (plainString.length) {
        printer.push(() => plainString);
        parser.push((str) =>
          str.startsWith(plainString)
            ? str.substring(plainString.length)
            : null,
        );
      }
    } else {
      inVariables = true;
      if (part.length) {
        printer.push(() => part);
        parser.push((str, _) =>
          str.startsWith(part) ? str.substring(part.length) : null,
        );
      }
    }
  }

  return {
    variables,
    parse: (
      tag: string,
      matchVersionPart: (variableName: string, str: string) => string | null,
    ) => {
      let rest: string | null = tag;
      for (const part of parser) {
        if (rest === null) return false;
        rest = part(rest, matchVersionPart);
      }
      return rest === '';
    },
    applyTemplate: (getVersionPart: (id: string) => string) =>
      printer.map((r) => r(getVersionPart)).join(''),
  };
}

let cacheA = new Map<string, Template>();
let cacheB = new Map<string, Template>();
function swapFullCaches() {
  if (cacheA.size > 20) {
    [cacheB, cacheA] = [cacheA, cacheB];
    cacheA.clear();
  }
}
export default function parseTemplate(str: string) {
  const cachedA = cacheA.get(str);
  if (cachedA) return cachedA;

  const cachedB = cacheB.get(str);
  if (cachedB) {
    cacheA.set(str, cachedB);
    swapFullCaches();
    return cachedB;
  }

  const fresh = parseVersionTagTemplateUncached(str);
  cacheA.set(str, fresh);
  swapFullCaches();

  return fresh;
}
