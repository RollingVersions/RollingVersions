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

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" [1,\\"--\\\\u003e\\",\\"SHASHASHA\\",[]] \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
  `);
  expect(
    writeState('Comment', {
      submittedAtCommitSha: 'SHASHASHA',
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
        packages: new Map([['fake package', getEmptyChangeSet()]]),
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
