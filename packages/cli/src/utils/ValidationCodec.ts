import {fold} from 'fp-ts/lib/Either';
import * as t from './io-ts';
import groupBy from '../ts-utils/groupBy';

export {t};

function getErrorPath(c: t.Context): string {
  const rest = c.slice((c[0].type as any)._tag === 'UnionType' ? 2 : 1);
  if (!rest.length) return c[0].key;
  return `${c[0].key}.${getErrorPath(rest)}`;
}

function getErrorPrefix(c: t.Context): {prefix: string; rest: t.Context} {
  const rest = c.slice(1);
  if (!rest.length || (c[0].type as any)._tag === 'UnionType') {
    return {prefix: c[0].key, rest};
  }
  const result = getErrorPrefix(rest);
  return {
    prefix: `${c[0].key}.${result.prefix}`,
    rest: result.rest,
  };
}

function buildErrorTree(
  errors: {e: t.ValidationError; c: t.Context}[],
): string {
  if (errors.length === 1) {
    return `You must pass ${
      errors[0].e.context[errors[0].e.context.length - 1].type.name
    } to ${getErrorPath(errors[0].e.context)} but you passed ${JSON.stringify(
      errors[0].e.value,
    )}`;
  }
  // group errors that refer to the same union
  const errorsByUnionPrefix = groupBy(
    errors.map(({e, c}) => ({e, ...getErrorPrefix(c)})),
    ({prefix}) => prefix,
  );

  const errorStrings = [...errorsByUnionPrefix.values()].map((byPath) => {
    // group errors that refer to the same case in the union
    const errorsByUnionCase = groupBy(byPath, ({rest}) =>
      rest.length === 0 ? null : rest[0].key,
    );
    if (errorsByUnionCase.size === 1) {
      return buildErrorTree(byPath.map(({e, rest}) => ({e, c: rest})));
    } else {
      const errorsByFullPath = groupBy(byPath, ({e}) =>
        getErrorPath(e.context),
      );
      if (errorsByFullPath.size === 1) {
        return `You must pass (${byPath
          .map(({e}) => e.context[errors[0].e.context.length - 1].type.name)
          .join(' | ')}) to ${getErrorPath(
          byPath[0].e.context,
        )} but you passed ${JSON.stringify(byPath[0].e.value)}`;
      }
      return `You must fix one of these errors:\n\n${[
        ...errorsByUnionCase.values(),
      ]
        .map((es) => buildErrorTree(es.map(({e, rest}) => ({e, c: rest}))))
        .join('\n\n')
        .replace(/^/gm, '  ')}`;
    }
  });
  if (errorStrings.length === 1) {
    return errorStrings[0];
  } else {
    return `You must fix all of these errors:\n\n${errorStrings
      .join('\n\n')
      .replace(/^/gm, '  ')}`;
  }
}
function printError(errors: t.Errors): string {
  return buildErrorTree(errors.map((e) => ({e, c: e.context})));
}

export type ValidationResult<T> =
  | {valid: true; value: T}
  | {valid: false; reason: string};

export default class ValidationCodec<T, S = T> {
  private readonly _codec: t.Decoder<unknown, T> & t.Encoder<T, S>;
  constructor(codec: t.Decoder<unknown, T> & t.Encoder<T, S>) {
    this._codec = codec;
  }

  public decode(value: unknown): ValidationResult<T> {
    return fold<t.Errors, T, ValidationResult<T>>(
      (errors: t.Errors) => ({
        valid: false,
        reason: printError(errors),
      }),
      (result: T) => ({
        valid: true,
        value: result,
      }),
    )(this._codec.decode(value));
  }

  public encode(value: T): S {
    return this._codec.encode(value);
  }
}

export const versionSymbol = Symbol();

type ArrayExtract<
  TProps extends any,
  TKeys extends readonly (keyof TProps)[]
> = {
  [key in keyof TKeys]: TProps[TKeys[key] & keyof TProps];
};

export function compressedObjectCodec<
  TVersion extends number,
  TProps extends Record<string, t.Mixed>,
  TKeys extends readonly [typeof versionSymbol, ...(keyof TProps)[]]
>(version: TVersion, name: string, props: TProps, keys: TKeys) {
  const BaseCodec = t.tuple<
    ArrayExtract<
      TProps & Record<typeof versionSymbol, t.LiteralC<TVersion>>,
      TKeys
    >
  >(
    keys.map((k) =>
      k === versionSymbol ? t.literal(version) : props[k],
    ) as any,
  );

  const ValidationCodec = t.type(props);

  type CompressedType = t.TypeOf<typeof BaseCodec>;
  type FullType = t.TypeOf<typeof ValidationCodec>;

  const ConversionCodec = new t.Type<FullType, CompressedType, CompressedType>(
    name,
    ValidationCodec.is,
    (v) => {
      const result: any = {};
      keys.forEach((key, i) => {
        if (key !== versionSymbol) {
          result[key] = v[i];
        }
      });
      return t.success(result);
    },
    (v) => keys.map((k) => (k === versionSymbol ? version : v[k])) as any,
  );
  return BaseCodec.pipe(ConversionCodec);
}

export function map<TKey extends t.Mixed, TValue extends t.Mixed>(
  keyCodec: TKey,
  valueCodec: TValue,
) {
  const encodedType = t.array(t.tuple([keyCodec, valueCodec] as const));
  return encodedType.pipe(
    new t.Type<
      Map<t.TypeOf<TKey>, t.TypeOf<TValue>>,
      t.TypeOf<typeof encodedType>,
      t.TypeOf<typeof encodedType>
    >(
      `Map<${keyCodec.name}, ${valueCodec.name}>`,
      (v): v is Map<t.TypeOf<TKey>, t.TypeOf<TValue>> => {
        return (
          v instanceof Map &&
          [...v.entries()].every(
            ([key, value]) => keyCodec.is(key) && valueCodec.is(value),
          )
        );
      },
      (v) => t.success(new Map(v)),
      (v) => [...v.entries()],
    ),
  );
}
