import React from 'react';
import GithubActionsCodeBlock from './githubActionsCodeBlock';
import {Instruction, Details, InlineCode, CodeBlock} from './docsFormats';

export default function GithubActions() {
  return (
    <>
      <Instruction>GitHub Actions</Instruction>
      <Details>
        Create a new file called{' '}
        <InlineCode>.github/workflows/rollingversions.yml</InlineCode>. In it,
        put:
      </Details>
      <GithubActionsCodeBlock />
      <Details>
        It's up to you what tests you run, the important thing is that it's
        triggered by{' '}
        <InlineCode>
          repository_dispatch of rollingversions_publish_approved
        </InlineCode>{' '}
        and that it eventually authenticates to npm and runs{' '}
        <InlineCode>npx rollingversions publish</InlineCode> - this will publish
        your release.
      </Details>
      <Details>
        Go to your repositories <InlineCode>Settings</InlineCode>
        {' > '}
        <InlineCode>Secrets</InlineCode> and add an{' '}
        <InlineCode>NPM_TOKEN</InlineCode> with permission to publish all the
        packages in this repository. You don't need to worry about the{' '}
        <InlineCode>GITHUB_TOKEN</InlineCode> as GitHub will generate one for
        your action automatically.
      </Details>

      <Details>
        Edit your <InlineCode>README.md</InlineCode> file and add the badge:
      </Details>
      <CodeBlock>
        {
          '[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen)](https://rollingversions.com/YOUR_GITHUB_LOGIN/YOUR_REPOSITORY_NAME)'
        }
      </CodeBlock>

      <Details>
        Next time you submit a pull request, you will be asked to add a change
        log. Once you've merged the pull request, you can click on the badge in
        the README and you will be taken to Rolling Versions, where you can
        preview the release, and approve it to be published (providing you have
        write or admin access to the GitHub repository).
      </Details>
    </>
  );
}
