import * as t from 'funtypes';

export {t};

export function compressedObjectCodec<
  O extends {
    readonly [_: string]: t.Runtype<any>;
  }
>(
  version: number,
  name: string,
  props: O,
  keys: (keyof O)[],
  {deprecated = false}: {deprecated?: boolean} = {},
): t.Codec<t.Static<t.Object<O, false>>> {
  for (const key of keys) {
    if (!(key in props)) {
      throw new Error(`Unexpected key: ${key}`);
    }
  }
  const keySet = new Set(keys);
  for (const key of Object.keys(props)) {
    if (!keySet.has(key)) {
      throw new Error(`Missing key: ${key}`);
    }
  }
  if (keys.length !== keySet.size) {
    throw new Error(`Duplicate keys detected`);
  }
  return t
    .Tuple([t.Literal(version), ...keys.map((k) => props[k])] as any)
    .parse({
      name,
      test: t.Object(props),
      parse([_version, ...values]: any) {
        const result: any = {};
        keys.forEach((key, i) => {
          result[key] = values[i];
        });
        return {success: true, value: result};
      },
      serialize: deprecated
        ? undefined
        : (obj: any) => ({
            success: true,
            value: [version, ...keys.map((k) => obj[k])],
          }),
    }) as any;
}

export function map<
  KeyCodec extends t.Codec<any>,
  ValueCodec extends t.Codec<any>
>(
  key: KeyCodec,
  value: ValueCodec,
): t.Codec<Map<t.Static<KeyCodec>, t.Static<ValueCodec>>> {
  return t.Array(t.Tuple(key, value)).withParser({
    parse(entries) {
      return {success: true, value: new Map(entries)};
    },
    serialize(map) {
      if (!(map instanceof Map)) {
        return {success: false, message: 'Expected a Map'};
      }
      return {success: true, value: [...map.entries()]};
    },
  });
}
