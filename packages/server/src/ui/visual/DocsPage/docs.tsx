import React from 'react';
import {InstallButton} from '../HeroBar';
import GithubActions from './githubActions';
import CircleCI from './circleCI';
import MonoRepos from './monoRepos';
import Selector from './selector';

export function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-4xl">{children}</h2>;
}
export function Instruction({children}: {children: string}) {
  return <h2 className="font-sans text-3xl">{children}</h2>;
}
export function Details({children}: {children: React.ReactNode}) {
  return <p className="font-sans text-xl">{children}</p>;
}

// TODO - I've made this gray text to tie in with the code in blocks
// It has the advantage of making the code stand out as such if text is printed (when backgrounds are lost).
export function InlineCode({children}: {children: React.ReactNode}) {
  return (
    <span className="font-mono text-base bg-gray-200 text-gray-800 ">
      {children}
    </span>
  );
}

// TODO - Does the choice of colour codes used matter technically?
// - was blue-800 and green-500 - but these
// add more colours to page.  Using orange ties in with logo

// TODO - I tried using <pre></pre> but as well as preserving spaces,
// it also prevents wrapping which means on smaller screens the text runs out of the
// grey code box.  So I've used the tailwind class whitespace-pre-wrap instead.
// Is this OK or would it be better not to wrap?
export function CodeBlock({children}: {children: React.ReactNode}) {
  return (
    <div className="bg-gray-200 py-4 block">
      <div className="whitespace-pre-wrap container mx-auto font-mono text-base text-gray-800 ml-2">
        {children}
      </div>
    </div>
  );
}

// TODO CodeLine effectively acting as a pseudonym for <p></p>
// Originally I was using it for some classes, but these are now all in CodeBlock
// which gives consistency when only one line is used.
// Could therefore do away with CodeLine and replace with p throughout?

export function CodeLine({children}: {children: React.ReactNode}) {
  return <p>{children}</p>;
}
export function CodePrefix({children}: {children: string}) {
  return <span className="text-orange-500">{children}</span>;
}

export default function Docs() {
  let selected: string = '';
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
          setSelected={(value: string) => (selected = value)}
        />
        {selected === 'github' ? (
          <GithubActions />
        ) : selected === 'circle' ? (
          <CircleCI />
        ) : null}
        <GithubActions />
        <CircleCI />
        <MonoRepos />
      </div>
    </>
  );
}
