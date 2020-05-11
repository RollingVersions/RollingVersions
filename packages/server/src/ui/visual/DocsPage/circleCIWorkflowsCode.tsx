import React from 'react';
import {CodeBlock, CodeLine, CodePrefix} from './docs';

export default function CircleCIWorkflowsCode() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>workflows:</CodePrefix>
      </CodeLine>
      <CodeLine>
        {'  '}
        <CodePrefix>release:</CodePrefix>
      </CodeLine>
      <CodeLine>
        {'    '}
        <CodePrefix>jobs: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'      '}
        <CodePrefix>- publish-dry-run: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>filters: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'            '}
        <CodePrefix>branches: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'              '}
        <CodePrefix>only: </CodePrefix>master
      </CodeLine>
      <br />
      <CodeLine>
        {'      '}
        <CodePrefix>- publish-approval: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>type: </CodePrefix>approval
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>requires: </CodePrefix>
      </CodeLine>
      <CodeLine>{'            '}- publish-dry-run</CodeLine>
      <br />
      <CodeLine>
        {'      '}
        <CodePrefix>- publish: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>requires: </CodePrefix>
      </CodeLine>
      <CodeLine>{'            '}- publish-approval</CodeLine>
      <CodeLine>
        {'          '}
        <CodePrefix>filters: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'            '}
        <CodePrefix>branches: </CodePrefix>
      </CodeLine>
      <CodeLine>
        {'              '}
        <CodePrefix>only: </CodePrefix>master
      </CodeLine>
    </CodeBlock>
  );
}
