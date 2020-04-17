import React from 'react';
import Wordmark from './wordmark.svg';
import WordmarkDark from './wordmark-dark.svg';

export default function Logo({
  dark,
  ...props
}: Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'width' | 'height' | 'src'
> & {dark?: boolean}) {
  return (
    <img
      alt="Rolling Versions"
      {...props}
      width="180px"
      height="47px"
      src={dark ? WordmarkDark : Wordmark}
    />
  );
}
