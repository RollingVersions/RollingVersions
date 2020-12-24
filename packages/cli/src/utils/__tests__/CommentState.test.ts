import {createEmptyChangeSet} from '../../types/ChangeSet';
import {writeState, readState} from '../CommentState';

test('writeState', () => {
  expect(
    writeState('Comment', {
      submittedAtCommitSha: '<-- hello world -->',
      packages: new Map(),
    }),
  ).toMatchInlineSnapshot(`
    "Comment

    <!-- \\"\\"\\"RollingVersions State Start\\"\\"\\" [2,\\"\\\\u003c-- hello world --\\\\u003e\\",[]] \\"\\"\\"RollingVersions State End\\"\\"\\" -->"
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
        submittedAtCommitSha: '<-- hello world -->',
        packages: new Map(),
      }),
    ),
  ).toMatchInlineSnapshot(`
    Object {
      "packages": Map {},
      "submittedAtCommitSha": "<-- hello world -->",
    }
  `);
  expect(
    readState(
      writeState('Comment', {
        submittedAtCommitSha: 'SHASHASHA',
        packages: new Map([['fake package', createEmptyChangeSet()]]),
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

const input = `<!-- This comment is maintained by Rolling Versions. Do not edit it manually! -->
<!-- 9d24171b-1f63-43f0-9019-c4202b3e8e22 -->

### Change Log for @rollingversions/test-single-npm-package-circleci (3.2.0 → 3.3.0)

#### New Features

- Feature 14

  It is the case that 13 < 14
  
  \`\`\`js
  assert(13 < 14)
  \`\`\`

[Edit changelog](https://staging.rollingversions.com/RollingVersions/test-single-npm-package-circleci/pull/14)

<!-- """RollingVersions State Start""" [2,"95894a0b11f7c789f7837f280683a52089d94bec",[["@rollingversions/test-single-npm-package-circleci",[1,[],[[1,"Feature 14","It is the case that 13 \\u0060 14\\n\\n\`\`\`js\\nassert(13 \\u0060 14)\\n\`\`\`"]],[],[],[]]]]] """RollingVersions State End""" -->`;
test('regression test', () => {
  expect(readState(input)).toMatchInlineSnapshot(`
    Object {
      "packages": Map {
        "@rollingversions/test-single-npm-package-circleci" => Object {
          "breaking": Array [],
          "feat": Array [
            Object {
              "body": "It is the case that 13 < 14

    \`\`\`js
    assert(13 < 14)
    \`\`\`",
              "title": "Feature 14",
            },
          ],
          "fix": Array [],
          "perf": Array [],
          "refactor": Array [],
        },
      },
      "submittedAtCommitSha": "95894a0b11f7c789f7837f280683a52089d94bec",
    }
  `);
});
