import React from 'react';
import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function GithubActionsCodeBlock() {
  return (
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
  );
}
