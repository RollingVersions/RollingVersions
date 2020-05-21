import React from 'react';
import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function GithubActionsCodeBlock() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>name: </CodePrefix>Release
      </CodeLine>
      {'\n'}
      <CodeLine>
        <CodePrefix>on:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>repository_dispatch:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>types: </CodePrefix>[rollingversions_publish_approved]
      </CodeLine>

      {'\n'}
      <CodeLine>
        <CodePrefix>jobs:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>test:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>runs-on: </CodePrefix>ubuntu-latest
      </CodeLine>

      {'\n'}
      <CodeLine indent={2}>
        <CodePrefix>strategy:</CodePrefix>
      </CodeLine>

      <CodeLine indent={3}>
        <CodePrefix>matrix:</CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>node-version: </CodePrefix>[8.x, 10.x, 12.x, 14.x]
      </CodeLine>

      {'\n'}
      <CodeLine indent={2}>
        <CodePrefix>steps:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/checkout@v2
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/setup-node@v1
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>with:</CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>node-version: </CodePrefix>
        {`\${{ matrix.node-version }}`}
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>npm test
      </CodeLine>

      {'\n'}
      <CodeLine indent={1}>
        <CodePrefix>publish:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>runs-on: </CodePrefix>ubuntu-latest
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>needs: </CodePrefix>test
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>steps:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/checkout@v2
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- uses: </CodePrefix>actions/setup-node@v1
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>with:</CodePrefix>
      </CodeLine>
      <CodeLine indent={4}>
        <CodePrefix>node-version: </CodePrefix>12.x
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>npm install
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>
        {`echo "//registry.npmjs.org/:_authToken=\${{ secrets.NPM_TOKEN }}" > ~/.npmrc`}
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>- run: </CodePrefix>
        {`npx rollingversions publish --github-token \${{ secrets.GITHUB_TOKEN }}`}
      </CodeLine>
    </CodeBlock>
  );
}
