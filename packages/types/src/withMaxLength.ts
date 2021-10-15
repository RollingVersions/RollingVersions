import * as t from 'funtypes';

export default function withMaxLength<T extends {readonly length: number}>(
  codec: t.Codec<T>,
  maxLength: number,
): t.Codec<T> {
  return t.Constraint(
    codec,
    (value) =>
      value.length > maxLength
        ? `Length must not be greater than ${maxLength}`
        : true,
    {name: `MaxLength<${codec.show ? codec.show(false) : codec.tag}>`},
  );
}
