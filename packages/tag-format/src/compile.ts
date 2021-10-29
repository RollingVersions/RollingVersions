import {Node, ParseState, Template} from './types';

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

export default function compile(node: Node): Template {
  const templatePart = compileNode(node);
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
