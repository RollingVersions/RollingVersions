import {writeState, readState} from '../CommentState';

test('writeState', () => {
  expect(writeState('Comment', {submittedAtCommitSha: '-->', packages: []}))
    .toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" {\\"submittedAtCommitSha\\":\\"\\\\u002d\\\\u002d\\\\u003e\\",\\"packages\\":[]} \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
  expect(
    writeState('Comment', {submittedAtCommitSha: 'SHASHASHA', packages: []}),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" {\\"submittedAtCommitSha\\":\\"SHASHASHA\\",\\"packages\\":[]} \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
});

test('readState', () => {
  expect(
    readState(
      writeState('Comment', {submittedAtCommitSha: '-->', packages: []}),
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
        submittedAtCommitSha: '-->',
        packages: [],
      }).replace(/\n/g, '\r\n'),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packages": Array [],
      "submittedAtCommitSha": "-->",
    }
  `);
});
