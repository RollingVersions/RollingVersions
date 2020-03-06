export default function isTruthy<T>(
  value: T,
): value is Exclude<T, null | undefined | void | 0 | ''> {
  return !!value;
}
