import {writeState, readState} from '../CommentState';
import getEmptyChangeSet from '../getEmptyChangeSet';

test('writeState', () => {
  expect(
    writeState('Comment', {
      submittedAtCommitSha: '-->',
      packageInfoFetchedAt: 'SHASHASHA',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" [1,\\"\\\\u002d\\\\u002d\\\\u003e\\",\\"SHASHASHA\\",[]] \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
  expect(
    writeState('Comment', {
      submittedAtCommitSha: 'SHASHASHA',
      packageInfoFetchedAt: 'SHASHASHA',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" [1,\\"SHASHASHA\\",\\"SHASHASHA\\",[]] \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
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
      "packageInfoFetchedAt": "SHASHASHA",
      "packages": Map {},
      "submittedAtCommitSha": "-->",
    }
  `);
  expect(
    readState(
      writeState('Comment', {
        submittedAtCommitSha: 'SHASHASHA',
        packageInfoFetchedAt: 'SHASHASHA',
        packages: new Map([
          ['fake package', {changes: getEmptyChangeSet(), info: []}],
        ]),
      }).replace(/\n/g, '\r\n'),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packageInfoFetchedAt": "SHASHASHA",
      "packages": Map {
        "fake package" => Object {
          "changes": Object {
            "breaking": Array [],
            "feat": Array [],
            "fix": Array [],
            "perf": Array [],
            "refactor": Array [],
          },
          "info": Array [],
        },
      },
      "submittedAtCommitSha": "SHASHASHA",
    }
  `);
});
