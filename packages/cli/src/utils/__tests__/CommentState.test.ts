import {writeState, readState} from '../CommentState';
import getEmptyChangeSet from '../getEmptyChangeSet';

test('writeState', () => {
  expect(
    writeState('Comment', {
      submittedAtCommitSha: '-->',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" [2,\\"--\\\\u003e\\",[]] \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
  expect(
    writeState('Comment', {
      submittedAtCommitSha: 'SHASHASHA',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" [2,\\"SHASHASHA\\",[]] \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
});

test('readState', () => {
  expect(
    readState(
      writeState('Comment', {
        submittedAtCommitSha: '-->',
        packages: new Map(),
      }),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packages": Map {},
      "submittedAtCommitSha": "-->",
    }
  `);
  expect(
    readState(
      writeState('Comment', {
        submittedAtCommitSha: 'SHASHASHA',
        packages: new Map([['fake package', getEmptyChangeSet()]]),
      }).replace(/\n/g, '\r\n'),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packages": Map {
        "fake package" => Object {
          "breaking": Array [],
          "feat": Array [],
          "fix": Array [],
          "perf": Array [],
          "refactor": Array [],
        },
      },
      "submittedAtCommitSha": "SHASHASHA",
    }
  `);
});
