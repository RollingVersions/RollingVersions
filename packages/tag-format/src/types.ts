export interface LiteralNode {
  type: 'literal';
  value: string;
}
export interface VariableNode {
  type: 'variable';
  name: string;
  filters: ((str: string) => string)[];
}
export interface OptionalSectionNode {
  type: 'optional_section';
  body: Node[];
}
export interface RootNode {
  type: 'root';
  body: Node[];
}
export type Node = LiteralNode | VariableNode | OptionalSectionNode | RootNode;

export type ParseState<T> = {rest: string; values: T[]};
export interface Template {
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
