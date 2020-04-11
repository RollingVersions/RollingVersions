export default function throwErr(msg: string, other: any = {}): never {
  throw Object.assign(new Error(msg), other);
}
