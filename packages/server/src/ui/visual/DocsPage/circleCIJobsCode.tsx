import React from 'react';
import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function CircleCIJobsCode() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>jobs:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>publish-dry-run:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>docker: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>image: </CodePrefix>circleci/node:12
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>steps: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>- checkout</CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm test
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>name: </CodePrefix>Authenticate with registry
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>command: </CodePrefix>
        {'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc'}
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npx rollingversions publish --dry-run
      </CodeLine>

      <CodeLine indent={1}>
        <CodePrefix>publish:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>docker: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>image: </CodePrefix>circleci/node:12
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>steps: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>- checkout</CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npm test
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>name: </CodePrefix>Authenticate with registry
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>command: </CodePrefix>
        {'echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc'}
      </CodeLine>
      <CodeLine indent={3}>
        - <CodePrefix>run: </CodePrefix>npx rollingversions publish
      </CodeLine>
    </CodeBlock>
  );
}
