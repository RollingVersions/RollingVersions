import React from 'react';
import {InstallButton} from '../HeroBar';

function Heading({children}: {children: string}) {
  return <h2 className="font-poppins text-4xl">{children}</h2>;
}
function Instruction({children}: {children: string}) {
  return <h2 className="font-sans text-3xl">{children}</h2>;
}
function Details({children}: {children: React.ReactNode}) {
  return <p className="font-sans text-xl">{children}</p>;
}
function InlineCode({children}: {children: React.ReactNode}) {
  return <span className="font-mono text-base bg-gray-200">{children}</span>;
}
function CodeBlock({children}: {children: React.ReactNode}) {
  return (
    <div className="bg-gray-200 py-4 block">
      <pre className="container mx-auto font-mono text-base ml-2">
        {children}
      </pre>
    </div>
  );
}
function CodeLine({children}: {children: React.ReactNode}) {
  return <p className="text-blue-800">{children}</p>;
}
function CodePrefix({children}: {children: string}) {
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
        <Instruction>GitHub Actions</Instruction>
        <Details>
          I want this to look like a block of text with{' '}
          <InlineCode>this bit looking like code</InlineCode> inserted in the
          text
        </Details>
        <CodeBlock>
          <CodeLine>
            <CodePrefix>name: </CodePrefix>Release
          </CodeLine>

          <br />
          <CodeLine>
            <CodePrefix>on:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'  '}
            <CodePrefix>repository_dispatch:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>types: </CodePrefix>[rollingversions_publish_approved]
          </CodeLine>

          <br />
          <CodeLine>
            <CodePrefix>jobs:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'  '}
            <CodePrefix>test:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>runs-on: </CodePrefix>ubuntu-latest
          </CodeLine>

          <br />
          <CodeLine>
            {'    '}
            <CodePrefix>strategy:</CodePrefix>
          </CodeLine>

          <CodeLine>
            {'      '}
            <CodePrefix>matrix:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'        '}
            <CodePrefix>node-version: </CodePrefix>[8.x, 10.x, 12.x, 14.x]
          </CodeLine>

          <br />
          <CodeLine>
            {'    '}
            <CodePrefix>steps:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>- uses: </CodePrefix>actions/checkout@v2
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>- uses: </CodePrefix>actions/setup-node@v1
          </CodeLine>
          <CodeLine>
            {'      '}
            <CodePrefix>with:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'        '}
            <CodePrefix>node-version: </CodePrefix>
            {'${{ matrix.node-version }}'}
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>- run: </CodePrefix>npm install
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>- run: </CodePrefix>npm test
          </CodeLine>

          <br />
          <CodeLine>
            {'  '}
            <CodePrefix>publish:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>runs-on: </CodePrefix>ubuntu-latest
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>needs: </CodePrefix>test
          </CodeLine>
          <CodeLine>
            {'    '}
            <CodePrefix>steps:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'      '}
            <CodePrefix>- uses: </CodePrefix>actions/checkout@v2
          </CodeLine>
          <CodeLine>
            {'      '}
            <CodePrefix>- uses: </CodePrefix>actions/setup-node@v1
          </CodeLine>
          <CodeLine>
            {'        '}
            <CodePrefix>with:</CodePrefix>
          </CodeLine>
          <CodeLine>
            {'          '}
            <CodePrefix>node-version: </CodePrefix>12.x
          </CodeLine>
          <CodeLine>
            {'      '}
            <CodePrefix>- run: </CodePrefix>npm install
          </CodeLine>
          <CodeLine>
            {'      '}
            <CodePrefix>- run: </CodePrefix>
            {
              'echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc'
            }
          </CodeLine>
          <CodeLine>
            {'      '}
            <CodePrefix>- run: </CodePrefix>
            {
              'npx rollingversions publish --github-token ${{ secrets.GITHUB_TOKEN }}'
            }
          </CodeLine>
        </CodeBlock>
      </div>
    </>
  );
}
