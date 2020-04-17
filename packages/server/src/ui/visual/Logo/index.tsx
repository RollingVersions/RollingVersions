import React from 'react';
const Wordmark = require('./wordmark.svg');
const WordmarkDark = require('./wordmark-dark.svg');

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
