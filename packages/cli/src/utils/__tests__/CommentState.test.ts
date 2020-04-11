import {writeState, readState} from '../CommentState';

test('writeState', () => {
  expect(
    writeState('Comment', {
      submittedAtCommitSha: '-->',
      packageInfoFetchedAt: 'SHASHASHA',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" {\\"submittedAtCommitSha\\":\\"\\\\u002d\\\\u002d\\\\u003e\\",\\"packages\\":[]} \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
  expect(
    writeState('Comment', {
      submittedAtCommitSha: 'SHASHASHA',
      packageInfoFetchedAt: 'SHASHASHA',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" {\\"submittedAtCommitSha\\":\\"SHASHASHA\\",\\"packages\\":[]} \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
});

test('readState', () => {
  expect(
    readState(
      writeState('Comment', {
        submittedAtCommitSha: '-->',
        packageInfoFetchedAt: 'SHASHASHA',
        packages: new Map(),
      }),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packages": Array [],
      "submittedAtCommitSha": "-->",
    }
  `);
  expect(
    readState(
      writeState('Comment', {
        submittedAtCommitSha: 'SHASHASHA',
        packageInfoFetchedAt: 'SHASHASHA',
        packages: new Map(),
      }).replace(/\n/g, '\r\n'),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packages": Array [],
      "submittedAtCommitSha": "-->",
    }
  `);
});
