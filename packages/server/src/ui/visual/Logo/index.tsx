import React from 'react';
import Wordmark from './wordmark.svg';
import WordmarkDark from './wordmark-dark.svg';

export default function Logo({
  dark,
  ...props
}: Omit<
  React.SVGProps<SVGElement>,
  'width' | 'height' | 'viewBox' | 'xmlns'
> & {
  dark?: boolean;
}) {
  if (dark) {
    return <WordmarkDark {...props} />;
  }
  return <Wordmark {...props} />;
}
