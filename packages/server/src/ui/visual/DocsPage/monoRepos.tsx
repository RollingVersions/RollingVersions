import React from 'react';

import {Instruction, Details, InlineCode} from './docsFormats';

// Note that the link to rolling versions is to a fixed version rather than the current version of the package.  This means that appropriate line is highlighted.

export default function MonoRepos() {
  return (
    <>
      <Instruction>Mono Repos</Instruction>
      <Details>
        If your project is in a mono repo, Rolling Versions will still work just
        fine without any changes, but you can optionally choose to ignore
        certain packages that should not have versions by adding{' '}
        <InlineCode>"@rollingversions/ignore": true</InlineCode> to your
        package.json. We do exactly that on{' '}
        <a
          className="border-b-2 border-orange-400 text-orange-400 hover:border-orange-400 hover:text-orange-500 focus:outline-none focus:shadow-orange focus:text-orange-500"
          href="https://github.com/RollingVersions/RollingVersions/blob/0276c1a0918a8c79b5b69dd5dadecc0bfefe0ed8/package.json#L4"
        >
          Rolling Versions itself
        </a>
        .
      </Details>
    </>
  );
}
