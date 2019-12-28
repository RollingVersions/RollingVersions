import {writeState, readState} from '../CommentState';

test('writeState', () => {
  expect(writeState('Comment', {submittedAtCommitSha: '-->', packages: []}))
    .toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"ChangeLogVersion State Start\\"\\"\\" {\\"submittedAtCommitSha\\":\\"\\\\u002d\\\\u002d\\\\u003e\\",\\"packages\\":[]} \\"\\"\\"ChangeLogVersion State End\\"\\"\\" -->"
  `);
  expect(
    writeState('Comment', {submittedAtCommitSha: 'SHASHASHA', packages: []}),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"ChangeLogVersion State Start\\"\\"\\" {\\"submittedAtCommitSha\\":\\"SHASHASHA\\",\\"packages\\":[]} \\"\\"\\"ChangeLogVersion State End\\"\\"\\" -->"
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
});
