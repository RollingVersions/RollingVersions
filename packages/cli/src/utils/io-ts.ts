import * as t from 'io-ts';
// tslint:disable-next-line: no-implicit-dependencies
export * from 'io-ts';

type TupleFn = <TCodecs extends readonly t.Mixed[]>(
  codecs: TCodecs,
  name?: string,
) => t.TupleType<
  {
    -readonly [K in keyof TCodecs]: TCodecs[K];
  },
  {
    [K in keyof TCodecs]: TCodecs[K] extends t.Mixed
      ? t.TypeOf<TCodecs[K]>
      : unknown;
  },
  {
    [K in keyof TCodecs]: TCodecs[K] extends t.Mixed
      ? t.OutputOf<TCodecs[K]>
      : unknown;
  }
>;

export const tuple: TupleFn = t.tuple as any;
