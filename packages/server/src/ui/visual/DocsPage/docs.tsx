import React from 'react';

import {InstallButton} from '../HeroBar';
import CircleCI from './circleCI';
import {Heading, Instruction, Details} from './docsFormats';
import GithubActions from './githubActions';
import MonoRepos from './monoRepos';
import type {CIservice} from './selector';
import Selector from './selector';

export default function Docs({
  selected,
  links,
}: {
  selected: CIservice | null;
  links: {[key in CIservice]: string};
}) {
  return (
    <>
      <div className="grid gap-4 md:gap-8">
        <Heading>Getting Started</Heading>
        <Instruction>Install the GitHub App</Instruction>
        <Details>
          To get started, you will need to install the GitHub App. This allows
          us to detect pull requests, comment on your pull requests with a
          preview of the change log, update build statuses, and trigger GitHub
          actions workflows if you use them for releases.
        </Details>
        <InstallButton />
        <Selector selected={selected} links={links} />
        {selected === 'github-actions' ? (
          <GithubActions />
        ) : selected === 'circle-ci' ? (
          <CircleCI />
        ) : null}
        {selected ? <MonoRepos /> : null}
      </div>
    </>
  );
}
