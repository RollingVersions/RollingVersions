import {URL} from 'url';
import {renderReleaseNotes, renderCommentWithoutState} from '../Rendering';
import {PublishTarget} from '../../types';
import getEmptyChangeSet from '../getEmptyChangeSet';

test('renderReleaseNotes', () => {
  expect(
    renderReleaseNotes({
      breaking: [
        {
          title: 'Old code no longer works',
          body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
          pr: 2,
        },
        {
          title: 'Errors are now strings instead of numbers',
          body: '',
        },
      ],
      feat: [],
      refactor: [],
      fix: [
        {
          title: 'Library no longer crashes your app',
          body: '',
          pr: 1,
        },
      ],
      perf: [],
    }),
  ).toMatchInlineSnapshot(`
    "### Breaking Changes

    - Old code no longer works (#2)

      Example using old code:
      
          oldCode();
      
      Example using new code:
      
          newCode()

    - Errors are now strings instead of numbers

    ### Bug Fixes

    - Library no longer crashes your app (#1)"
  `);
});

test('renderCommentWithoutState', () => {
  expect(
    renderCommentWithoutState(
      {
        repo: {owner: 'Foo', name: 'bar'},
        number: 10,
      },
      {
        packageInfoFetchedAt: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
        submittedAtCommitSha: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
        packages: new Map([
          [
            'changelogversion\u002dutils',
            {
              changes: getEmptyChangeSet(),
              info: [
                {
                  path: 'changelogversion-utils/package.json',
                  publishTarget: PublishTarget.npm,
                  publishConfigAccess: 'public',
                  packageName: 'changelogversion\u002dutils',
                  notToBePublished: true,
                  registryVersion: null,
                  versionTag: null,
                },
              ],
            },
          ],
          [
            'changelogversion',
            {
              changes: {
                ...getEmptyChangeSet(),
                feat: [{title: 'Something awesome was added', body: ''}],
              },
              info: [
                {
                  path: 'changelogversion/package.json',
                  publishTarget: PublishTarget.npm,
                  publishConfigAccess: 'public',
                  packageName: 'changelogversion',
                  notToBePublished: true,
                  registryVersion: null,
                  versionTag: null,
                },
              ],
            },
          ],
          [
            'changelogversion\u002dserver',
            {
              changes: getEmptyChangeSet(),
              info: [
                {
                  path: 'changelogversion-server/package.json',
                  publishTarget: PublishTarget.npm,
                  publishConfigAccess: 'public',
                  packageName: 'changelogversion\u002dserver',
                  notToBePublished: true,
                  registryVersion: null,
                  versionTag: null,
                },
              ],
            },
          ],
        ]),
      },
      new URL('https://example.com'),
    ),
  ).toMatchInlineSnapshot(`
    "### changelogversion (unreleased → 1.0.0)

    #### New Features

    - Something awesome was added

    ### Packages With No Changes

    The following packages have no user facing changes, so won't be released:

    - changelogversion-server
    - changelogversion-utils

    [Edit changelogs](https://example.com/Foo/bar/pulls/10)"
  `);
});
