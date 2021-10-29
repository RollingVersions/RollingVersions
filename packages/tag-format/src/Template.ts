import assert from 'assert';

type ParseState<T> = {rest: string; values: T[]};
interface Template {
  variables: string[];
  parse: <T>(
    tag: string,
    matchVersionPart: (
      state: ParseState<T>,
      variableName: string,
    ) => null | ParseState<T>,
  ) => null | T[];
  print: (getVersionPart: (id: string) => string) => string;
}

interface TemplatePart {
  variables: string[];
  print: (getVersionPart: (id: string) => string) => string;
  /**
   * Parse the next part of the version and return `null` if it failed
   * to match and the remaining string if it matched. Call matchVersionPart
   * for each version part. The call to matchVersionPart
   */
  parse: <T>(
    state: ParseState<T>,
    matchVersionPart: (
      state: ParseState<T>,
      variableName: string,
    ) => null | ParseState<T>,
  ) => null | ParseState<T>;
}

interface LiteralNode {
  type: 'literal';
  value: string;
}
interface VariableNode {
  type: 'variable';
  name: string;
  filters: ((str: string) => string)[];
}
interface OptionalSectionNode {
  type: 'optional_section';
  body: Node[];
}
interface RootNode {
  type: 'root';
  body: Node[];
}
type Node = LiteralNode | VariableNode | OptionalSectionNode | RootNode;

function indexOfAny(str: string, searchStrings: string[]) {
  const indexes = searchStrings
    .map((s) => str.indexOf(s))
    .filter((i) => i !== -1);
  if (indexes.length === 0) return -1;
  return Math.min(...indexes);
}

function parseExpression(str: string): [Node, string] {
  if (str[0] === `?`) {
    // to parse an optional section, keep parsing nodes until you find the closing "}}"
    const body: Node[] = [];
    let rest = str.substr(1).trim();
    while (!rest.startsWith(`}}`) && rest.length !== 0) {
      const [node, r] = parseNode(rest);
      body.push(node);
      rest = r;
    }
    if (!rest.startsWith(`}}`)) {
      throw new Error(`Tag format has a "{{" without the matching "}}"`);
    }
    return [{type: 'optional_section', body}, rest.substr(2)];
  }

  const closeIdx = str.indexOf(`}}`);
  if (closeIdx === -1) {
    throw new Error(`Tag format has a "{{" without the matching "}}"`);
  }
  const placeholder = str.substr(0, closeIdx);
  const rest = str.substr(closeIdx + 2);
  if (!placeholder) {
    throw new Error(`Tag format has an empty "{{}}" placeholder`);
  }

  const [name, ...filters] = placeholder.split('|').map((str) => str.trim());

  for (const filter of filters) {
    const [filterName, ...params] = filter.split(' ').filter((v) => v.trim());
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

  return [
    {
      type: `variable`,
      name,
      filters: filters.map((filter) => {
        const [filterName, ...params] = filter
          .split(' ')
          .filter((v) => v.trim());
        switch (filterName) {
          case 'pad-number': {
            assert(
              params.length === 1,
              `The ${filterName} filter requires a value for the required length: ${str}`,
            );
            assert(
              /^[0-9]+$/.test(params[0]),
              `The parameter for the ${filterName} filter must be an integer: ${str}`,
            );
            const length = parseInt(params[0], 10);
            return (str: string) => str.padStart(length, '0');
          }
          default:
            throw new Error(
              `Unrecognized filter in version format, "${filter}" in: ${str}`,
            );
        }
      }),
    },
    rest,
  ];
}

function parseNode(str: string): [Node, string] {
  if (str.startsWith(`{{`)) {
    return parseExpression(str.substr(2));
  } else if (str.startsWith(`}}`)) {
    throw new Error(`Tag format has a "}}" without the matching "{{"`);
  }

  const nextIndex = indexOfAny(str, [`{{`, `}}`]);

  if (nextIndex === -1) {
    // no open or close, so the rest of the string is a literal
    return [{type: 'literal', value: str.trim()}, ''];
  }

  return [
    {type: 'literal', value: str.substr(0, nextIndex).trim()},
    str.substr(nextIndex),
  ];
}

function parse(str: string): Node {
  const body: Node[] = [];
  let rest = str;
  while (rest.length) {
    const [node, r] = parseNode(rest);
    body.push(node);
    rest = r;
  }
  return {type: 'root', body};
}

function mergeVariables(body: TemplatePart[]) {
  const variables: string[] = [];
  for (const b of body) {
    for (const v of b.variables) {
      if (variables.includes(v)) {
        throw new Error(`Duplicate variable in tag format: ${v}`);
      }
      variables.push(v);
    }
  }
  return variables;
}
function compileNode(node: Node): TemplatePart {
  switch (node.type) {
    case 'literal':
      return {
        variables: [],
        print() {
          return node.value;
        },
        parse(state) {
          if (state.rest.startsWith(node.value)) {
            state.rest = state.rest.substr(node.value.length);
            return state;
          } else {
            return null;
          }
        },
      };
    case 'variable':
      return {
        variables: [node.name],
        print(getVersionPart) {
          return node.filters.reduce<string>(
            (value, filter): string => filter(value),
            getVersionPart(node.name),
          );
        },
        parse(state, matchVersionPart) {
          return matchVersionPart(state, node.name);
        },
      };
    case 'optional_section': {
      const body = node.body.map((n) => compileNode(n));
      const variables = mergeVariables(body);
      return {
        variables,
        print(getVersionPart) {
          if (variables.every((v) => getVersionPart(v) === `0`)) {
            return ``;
          }
          return body.map((b) => b.print(getVersionPart)).join(``);
        },
        parse(state, matchVersionPart) {
          // deep copy the state in case we are unable to match
          // the optional part
          let lastState = {rest: state.rest, values: state.values.slice()};
          for (const b of body) {
            const match = b.parse(lastState, matchVersionPart);
            // if part of this optional section does not match,
            // return the state before the optional section
            if (!match) return state;
            lastState = match;
          }
          return lastState;
        },
      };
    }
    case 'root': {
      const body = node.body.map((n) => compileNode(n));
      const variables = mergeVariables(body);
      return {
        variables,
        print(getVersionPart) {
          return body.map((b) => b.print(getVersionPart)).join(``);
        },
        parse(state, matchVersionPart) {
          let lastState = state;
          for (const b of body) {
            const match = b.parse(lastState, matchVersionPart);
            if (!match) return null;
            lastState = match;
          }
          return lastState;
        },
      };
    }
  }
}

function parseVersionTagTemplateUncached(str: string): Template {
  const templatePart = compileNode(parse(str));
  return {
    variables: templatePart.variables,
    parse(tag, matchVersionPart) {
      return (
        templatePart.parse({rest: tag, values: []}, matchVersionPart)?.values ??
        null
      );
    },
    print(getVersionPart) {
      return templatePart.print(getVersionPart);
    },
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
