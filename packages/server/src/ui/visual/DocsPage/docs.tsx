import React from 'react';
import {InstallButton} from '../HeroBar';

export default function Docs() {
  function Heading({children}: {children: string}) {
    return <h2 className="font-poppins text-4xl">{children}</h2>;
  }
  function Instruction({children}: {children: string}) {
    return <h2 className="font-sans text-3xl">{children}</h2>;
  }
  function Details({children}: {children: React.ReactNode}) {
    return <p className="font-sans text-xl">{children}</p>;
  }
  function Code({children}: {children: React.ReactNode}) {
    return <span className="font-mono text-base bg-gray-200">{children}</span>;
  }
  function CodeBlock({children}: {children: React.ReactNode}) {
    return (
      <div className="bg-gray-200 py-4 block">
        <div className="container mx-auto font-mono text-l">{children}</div>
      </div>
    );
  }

  type Code = {
    prefix: string | null;
    code: string | Code[];
  };

  function printCodeLine({prefix, code}: Code, indent: number) {
    return (
      <p className={'ml-' + indent}>
        <span className="text-green-500">{prefix}</span>
        {': '}
        {typeof code === 'string' ? (
          <span className="text-blue-800">{code}</span>
        ) : (
          printCode(code, indent)
        )}
      </p>
    );
  }

  function printCode(
    codeBlock: Code | Code[],
    indent?: number,
  ): React.ReactNode {
    if (Array.isArray(codeBlock)) {
      return codeBlock.map((c: Code) => printCode(c, (indent || 0) + 2));
    } else {
      return printCodeLine(codeBlock, indent || 0);
    }
  }

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
          <Code>this bit looking like code</Code> inserted in the text
        </Details>
        <CodeBlock>
          {printCode([
            {prefix: 'name', code: 'Release'},
            {
              prefix: 'on',
              code: [
                {
                  prefix: 'repository_dispatch',
                  code: [
                    {
                      prefix: 'types',
                      code: '[rollingversions_publish_approved]',
                    },
                  ],
                },
              ],
            },
            {
              prefix: 'jobs',
              code: [
                {
                  prefix: 'test',
                  code: [{prefix: 'runs-on', code: 'ubuntu-latest'}],
                },

                {
                  prefix: 'strategy',
                  code: [
                    {
                      prefix: 'matrix',
                      code: [
                        {
                          prefix: 'node-version',
                          code: '[8.x, 10.x, 12.x, 14.x]',
                        },
                      ],
                    },
                  ],
                },

                {
                  prefix: 'steps',
                  code: [
                    {prefix: '- uses', code: 'actions/checkout@v2'},
                    {prefix: '- uses', code: 'actions/setup-node@v1'},
                    [
                      {
                        prefix: 'with',
                        code: [
                          {
                            prefix: 'node-version',
                            code: '${{ matrix.node-version }}',
                          },
                        ],
                      },
                    ],
                    {prefix: '- run', code: 'npm install'},
                    {prefix: '- run', code: 'npm test'},
                  ],
                },
              ],
            },
          ])}
        </CodeBlock>
      </div>
    </>
  );
}
