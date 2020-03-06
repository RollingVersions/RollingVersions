import {URL} from 'url';
import {renderReleaseNotes, renderCommentWithoutState} from '../Rendering';
import {Platform} from '../Platforms';

test('renderReleaseNotes', () => {
  expect(
    renderReleaseNotes([
      {
        type: 'fix',
        title: 'Library no longer crashes your app',
        body: '',
        pr: 1,
      },
      {
        type: 'breaking',
        title: 'Old code no longer works',
        body: `Example using old code:\n\n    oldCode();\n\nExample using new code:\n\n    newCode()`,
        pr: 2,
      },
      {
        type: 'breaking',
        title: 'Errors are now strings instead of numbers',
        body: '',
      },
    ] as const),
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
        owner: 'Foo',
        repo: 'bar',
        number: 10,
        headSha: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
        currentVersions: {
          'changelogversion\u002dutils': [
            {
              path: 'changelogversion-utils/package.json',
              platform: Platform.npm,
              publishConfigAccess: 'public',
              packageName: 'changelogversion\u002dutils',
              notToBePublished: true,
              registryVersion: null,
              versionTag: null,
            },
          ],
          changelogversion: [
            {
              path: 'changelogversion/package.json',
              platform: Platform.npm,
              publishConfigAccess: 'public',
              packageName: 'changelogversion',
              notToBePublished: true,
              registryVersion: null,
              versionTag: null,
            },
          ],
          'changelogversion\u002dserver': [
            {
              path: 'changelogversion-server/package.json',
              platform: Platform.npm,
              publishConfigAccess: 'public',
              packageName: 'changelogversion\u002dserver',
              notToBePublished: true,
              registryVersion: null,
              versionTag: null,
            },
          ],
        },
      },
      {
        submittedAtCommitSha: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
        packages: [
          {
            packageName: 'changelogversion',
            changes: [
              {type: 'feat', title: 'Something awesome was added', body: ''},
            ],
          },
        ],
        packageInfoCache: {
          headSha: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
          packages: {
            'changelogversion\u002dutils': [
              {
                path: 'changelogversion-utils/package.json',
                platform: Platform.npm,
                publishConfigAccess: 'public',
                packageName: 'changelogversion\u002dutils',
                notToBePublished: true,
                registryVersion: null,
                versionTag: null,
              },
            ],
            changelogversion: [
              {
                path: 'changelogversion/package.json',
                platform: Platform.npm,
                publishConfigAccess: 'public',
                packageName: 'changelogversion',
                notToBePublished: true,
                registryVersion: null,
                versionTag: null,
              },
            ],
            'changelogversion\u002dserver': [
              {
                path: 'changelogversion-server/package.json',
                platform: Platform.npm,
                publishConfigAccess: 'public',
                packageName: 'changelogversion\u002dserver',
                notToBePublished: true,
                registryVersion: null,
                versionTag: null,
              },
            ],
          },
        },
      },
      new URL('https://example.com'),
    ),
  ).toMatchInlineSnapshot(`
    "## Change Logs

    ### changelogversion (unreleased → 1.0.0)

    #### New Features

    - Something awesome was added

    ## Packages With No Changes

    The following packages have no user facing changes, so won't be released:

    - changelogversion-server
    - changelogversion-utils

    [Edit changelogs](https://example.com/Foo/bar/pulls/10)"
  `);
});
