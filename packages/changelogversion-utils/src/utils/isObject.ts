export default function isObject(
  value: unknown,
): value is Record<string | number | symbol, unknown> {
  return value && typeof value === 'object';
}
