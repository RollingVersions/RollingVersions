export default function isTruthy<T>(
  v: T,
): v is Exclude<T, undefined | void | null | 0 | '' | false> {
  return !!v;
}
