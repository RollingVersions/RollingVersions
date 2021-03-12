import React from 'react';

import {CodeBlock, CodeLine, CodePrefix} from './docsFormats';

export default function CircleCIWorkflowsCode() {
  return (
    <CodeBlock>
      <CodeLine>
        <CodePrefix>workflows:</CodePrefix>
      </CodeLine>
      <CodeLine indent={1}>
        <CodePrefix>release:</CodePrefix>
      </CodeLine>
      <CodeLine indent={2}>
        <CodePrefix>jobs: </CodePrefix>
      </CodeLine>
      <CodeLine indent={3}>
        <CodePrefix>- publish-dry-run: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>filters: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>
        <CodePrefix>branches: </CodePrefix>
      </CodeLine>
      <CodeLine indent={7}>
        <CodePrefix>only: </CodePrefix>master
      </CodeLine>

      {'\n'}
      <CodeLine indent={3}>
        <CodePrefix>- publish-approval: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>type: </CodePrefix>approval
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>requires: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>- publish-dry-run</CodeLine>

      {'\n'}
      <CodeLine indent={3}>
        <CodePrefix>- publish: </CodePrefix>
      </CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>requires: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>- publish-approval</CodeLine>
      <CodeLine indent={5}>
        <CodePrefix>filters: </CodePrefix>
      </CodeLine>
      <CodeLine indent={6}>
        <CodePrefix>branches: </CodePrefix>
      </CodeLine>
      <CodeLine indent={7}>
        <CodePrefix>only: </CodePrefix>master
      </CodeLine>
    </CodeBlock>
  );
}
