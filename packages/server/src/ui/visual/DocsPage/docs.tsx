import React, {useState} from 'react';
import {InstallButton} from '../HeroBar';
import {Heading, Instruction, Details} from './docsFormats';
import GithubActions from './githubActions';
import CircleCI from './circleCI';
import MonoRepos from './monoRepos';
import Selector, {CIservice} from './selector';

export default function Docs() {
  const [selected, setSelected] = useState<CIservice | null>(null);

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
        <Selector
          selected={selected}
          setSelected={(value: CIservice) => setSelected(value)}
        />
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
