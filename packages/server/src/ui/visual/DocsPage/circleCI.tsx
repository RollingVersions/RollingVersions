import React from 'react';

import CircleCIJobsCode from './circleCIJobsCode';
import CircleCIWorkflowsCode from './circleCIWorkflowsCode';
import {Instruction, Details, InlineCode} from './docsFormats';

export default function CircleCI() {
  return (
    <>
      <Instruction>Circle CI</Instruction>
      <Details>
        In your Circle CI config, add a workflow that has a{' '}
        <InlineCode>publish-dry-run</InlineCode> and{' '}
        <InlineCode>publish</InlineCode> step separated by a{' '}
        <InlineCode>publish-approval</InlineCode> step:
      </Details>

      <CircleCIWorkflowsCode />
      <Details>Add the corresponding jobs:</Details>
      <CircleCIJobsCode />
      <Details>
        The exact job names and steps are up to you. All that is important is
        that it authenticates to npm and runs{' '}
        <InlineCode>npx rollingversions publish</InlineCode>.
      </Details>
      <Details>
        In the settings for this repository on Circle CI, add these environment
        variables:
      </Details>

      <ul className="font-sans text-xl list-square ml-10">
        <li>
          <InlineCode>GITHUB_TOKEN</InlineCode> - a GitHub personal access token
          with at least "repo" scope.
        </li>
        <li>
          <InlineCode>NPM_TOKEN</InlineCode> - an npm token with permission to
          publish all the packages in this repo
        </li>
      </ul>
      <Details>
        Next time you submit a pull request, you will be asked to add a change
        log. Once you've merged the pull request, you can go to the workflow in
        Circle CI, see the output of the <InlineCode>--dry-run</InlineCode> and
        optionally approve the release to trigger the final part of the workflow
        - publishing your package.
      </Details>
    </>
  );
}
