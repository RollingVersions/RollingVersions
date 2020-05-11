import React from 'react';
import {CodeBlock, CodeLine, CodePrefix} from './docs';

export default function CircleCIJobsCode() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>jobs:</CodePrefix>
      </CodeLine>
      <CodeLine>
        {'  '}
        <CodePrefix>publish-dry-run:</CodePrefix>
      </CodeLine>
      <CodeLine>
        {'    '}
        <CodePrefix>docker: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>image: </CodePrefix>circleci/node:12
      </CodeLine>
      <CodeLine>
        {'    '}
        <CodePrefix>steps: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'      - '}
        checkout
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>npm test
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>name: </CodePrefix>Authenticate with registry
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>command: </CodePrefix>
        {'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc'}
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>npx rollingversions publish --dry-run
      </CodeLine>

      <CodeLine>
        {'  '}
        <CodePrefix>publish:</CodePrefix>
      </CodeLine>
      <CodeLine>
        {'    '}
        <CodePrefix>docker: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>image: </CodePrefix>circleci/node:12
      </CodeLine>
      <CodeLine>
        {'    '}
        <CodePrefix>steps: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'      - '}
        checkout
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>npm test
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>name: </CodePrefix>Authenticate with registry
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>command: </CodePrefix>
        {'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc'}
      </CodeLine>
      <CodeLine>
        {'      - '}
        <CodePrefix>run: </CodePrefix>npx rollingversions publish
      </CodeLine>
    </CodeBlock>
  );
}
