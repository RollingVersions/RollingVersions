import React from 'react';
import {Instruction, Details, InlineCode} from './docsFormats';

// TODO I have used the fixed link rather than linking to the current version of the package.  Is this the right thing to do - means that appropriate line is highlighted but it  will go out of date

// TODO I have put the link in orange, but I'm far from convinced that this is a good idea.  People tend to associate blue with links so this may be a better option?  I don't think a logo indicator works here as it breaks the flow of the text?  Thoughts?

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
          className="text-orange-500"
          href="https://github.com/RollingVersions/RollingVersions/blob/0276c1a0918a8c79b5b69dd5dadecc0bfefe0ed8/package.json#L4"
        >
          Rolling Versions itself
        </a>
        .
      </Details>
    </>
  );
}
