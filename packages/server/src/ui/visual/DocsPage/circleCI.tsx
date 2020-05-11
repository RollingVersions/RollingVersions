import React from 'react';
import CircleCIWorkflowsCode from './circleCIWorkflowsCode';
import CircleCIJobsCode from './circleCIJobsCode';
import {Instruction, Details, InlineCode, CodeBlock, CodeLine} from './docs';

export default function CircleCI() {
  return (
    <>
      <Instruction>Circle CI</Instruction>
      <Details>
        In your Circle CI config, add a workflow that has a{' '}
        <InlineCode>publish-dry-run</InlineCode> and publish step separated by a{' '}
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
        {/* TODO Forbes I think a square bullet point to tie in with squares in logo and amended tailwind config and index.css (hopefully correctly). If you don't agree you will need to undo. */}
        {/* TODO Alignment is wrong */}
        <ul className="list-square">
          <li>
            <InlineCode>GITHUB_TOKEN</InlineCode> - a GitHub personal access
            token with at least "repo" scope.
          </li>
          <li>
            <InlineCode>NPM_TOKEN</InlineCode> - an npm token with permission to
            publish all the packages in this repo
          </li>
        </ul>
      </Details>
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
