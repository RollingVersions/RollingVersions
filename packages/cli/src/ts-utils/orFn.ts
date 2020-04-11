export default function orFn<
  TInput,
  TOutputA extends TInput,
  TOutputB extends TInput
>(fnA: (v: TInput) => v is TOutputA, fnB: (v: TInput) => v is TOutputB) {
  return (v: TInput): v is TOutputA | TOutputB => fnA(v) || fnB(v);
}
