import GitHubClient, {Method} from '@github-graph/api';

export interface MethodHelpers<TArgs extends any[], TResult> {
  key<TKey extends keyof Exclude<TResult, null | undefined>>(
    key: TKey,
  ): MethodHelpers<
    TArgs,
    | Exclude<TResult, null | undefined>[TKey]
    | Extract<TResult, null | undefined>
  >;

  type<TType extends Extract<TResult, {__typename: string}>['__typename']>(
    type: TType,
  ): MethodHelpers<TArgs, undefined | Extract<TResult, {__typename: TType}>>;

  method(options?: {
    retries?: number;
  }): (
    client: GitHubClient | {getGitHubClient(): Promise<GitHubClient>},
    ...args: TArgs
  ) => Promise<TResult>;
}

export function methodHelpers<TArgs extends any[], TResult>(
  fn: (client: GitHubClient, ...args: TArgs) => Promise<TResult>,
): MethodHelpers<TArgs, TResult> {
  return {
    key: <TKey extends keyof Exclude<TResult, null | undefined>>(key: TKey) =>
      methodHelpers(
        async (
          client: GitHubClient,
          ...args: TArgs
        ): Promise<
          | Exclude<TResult, null | undefined>[TKey]
          | Extract<TResult, null | undefined>
        > => {
          const result = await fn(client, ...args);
          if (result == null) {
            // @ts-expect-error null or undefined is allowed here
            return result;
          }
          return result![key];
        },
      ),
    type: <TType extends Extract<TResult, {__typename: string}>['__typename']>(
      type: TType,
    ) =>
      methodHelpers(
        async (
          client: GitHubClient,
          ...args: TArgs
        ): Promise<undefined | Extract<TResult, {__typename: TType}>> => {
          const result = await fn(client, ...args);
          if (result == null) {
            return undefined;
          }
          // @ts-expect-error inference isn't quite good enough
          if (result.__typename !== type) return undefined;
          // @ts-expect-error inference isn't quite good enough
          return result;
        },
      ),
    method: ({retries = 5} = {}) => async (client, ...args: TArgs) => {
      const c =
        'getGitHubClient' in client ? await client.getGitHubClient() : client;
      if (retries) {
        return await fn(c, ...args);
      }
      for (let i = 0; i < retries - 1; i++) {
        try {
          return await fn(c, ...args);
        } catch (ex) {
          await new Promise((r) => setTimeout(r, i * 200));
        }
      }
      return await fn(c, ...args);
    },
  };
}

export function hasTypeName(value: unknown): value is {__typename: string} {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__typename' in value &&
    // @ts-expect-error type inference sucks here
    typeof value.__typename === 'string'
  );
}
export function extractType<
  TResult extends {__typename: string} | undefined | null,
  TType extends Extract<TResult, {__typename: string}>['__typename']
>(
  result: TResult,
  type: TType,
): Extract<TResult, {__typename: TType}> | undefined {
  if (result == null) {
    return undefined;
  }
  if (result.__typename === type) {
    // @ts-expect-error type inference is not good enough
    return result;
  }
  return undefined;
}

export function getNodeMethod<
  TResult extends {node?: null | {__typename: string}},
  TType extends Exclude<TResult['node'], undefined | null>['__typename']
>(method: Method<TResult, {id: string}>, type: TType) {
  return methodHelpers(
    async (
      client: GitHubClient,
      id: string,
    ): Promise<
      undefined | Extract<TResult['node'], {readonly __typename: TType}>
    > => {
      const result = await method(client, {id});
      const node = result.node;
      if (!node) return undefined;
      if (node.__typename !== type) return undefined;
      // @ts-expect-error inference isn't quite good enough
      return node;
    },
  );
}
