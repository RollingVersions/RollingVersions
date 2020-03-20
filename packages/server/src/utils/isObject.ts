export default function isObject(
  value: unknown,
): value is {[key: string]: unknown} {
  return value && typeof value === 'object';
}
