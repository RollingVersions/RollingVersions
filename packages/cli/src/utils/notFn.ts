export default function notFn<TInput, TOutput extends TInput>(
  fn: (v: TInput) => v is TOutput,
) {
  return (v: TInput): v is Exclude<TInput, TOutput> => !fn(v);
}
