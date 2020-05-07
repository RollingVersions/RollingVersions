import React from 'react';
import {InstallButton} from '../HeroBar';
import GithubActions from './githubActions';

export function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-4xl">{children}</h2>;
}
export function Instruction({children}: {children: string}) {
  return <h2 className="font-sans text-3xl">{children}</h2>;
}
export function Details({children}: {children: React.ReactNode}) {
  return <p className="font-sans text-xl">{children}</p>;
}
export function InlineCode({children}: {children: React.ReactNode}) {
  return <span className="font-mono text-base bg-gray-200">{children}</span>;
}
export function CodeBlock({children}: {children: React.ReactNode}) {
  return (
    <div className="bg-gray-200 py-4 block">
      <pre className="container mx-auto font-mono text-base ml-2">
        {children}
      </pre>
    </div>
  );
}
export function CodeLine({children}: {children: React.ReactNode}) {
  return <p className="text-blue-800">{children}</p>;
}
export function CodePrefix({children}: {children: string}) {
  return <span className="text-green-500">{children}</span>;
}

export default function Docs() {
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

        <GithubActions />
      </div>
    </>
  );
}
