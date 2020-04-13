export default function arrayEvery<TInput, TOutput extends TInput>(
  arr: TInput[],
  fn: (v: TInput, index: number, array: readonly TInput[]) => v is TOutput,
): arr is TOutput[];
export default function arrayEvery<TInput, TOutput extends TInput>(
  arr: readonly TInput[],
  fn: (v: TInput, index: number, array: readonly TInput[]) => v is TOutput,
): arr is readonly TOutput[];
export default function arrayEvery<TInput, TOutput extends TInput>(
  arr: readonly TInput[],
  fn: (v: TInput, index: number, array: readonly TInput[]) => v is TOutput,
): arr is TOutput[] {
  return arr.every(fn);
}
