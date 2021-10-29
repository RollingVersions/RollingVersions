import {Node} from './types';

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
            if (params.length !== 1) {
              throw new Error(
                `The ${filterName} filter requires a value for the required length: ${str}`,
              );
            }

            if (!/^[0-9]+$/.test(params[0])) {
              throw new Error(
                `The parameter for the ${filterName} filter must be an integer: ${str}`,
              );
            }

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

export function parse(str: string): Node {
  const body: Node[] = [];
  let rest = str;
  while (rest.length) {
    const [node, r] = parseNode(rest);
    body.push(node);
    rest = r;
  }
  return {type: 'root', body};
}
