export default function isString<T>(v: T): v is Extract<T, string> {
  return typeof v === 'string';
}
