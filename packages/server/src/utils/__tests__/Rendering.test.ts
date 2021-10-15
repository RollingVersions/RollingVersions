import {URL} from 'url';

import {DEFAULT_CONFIG} from '@rollingversions/config';

import type {PullRequestPackage} from '../../types';
import {renderCommentWithoutState} from '../Rendering';

function mockPackage(
  packageName: string,
  {
    changeSet,
    released,
    ...manifest
  }: Partial<PullRequestPackage['manifest']> & {
    changeSet?: PullRequestPackage['changeSet'];
    released?: boolean;
  } = {},
): PullRequestPackage {
  return {
    manifest: {
      ...DEFAULT_CONFIG,
      customized: [],
      packageName: packageName,
      targetConfigs: [],
      dependencies: {required: [], optional: [], development: []},
      ...manifest,
    },
    currentVersion: null,
    changeSet: changeSet ?? [],
    released: released ?? false,
  };
}

test('renderCommentWithoutState', () => {
  expect(
    renderCommentWithoutState(
      {
        repo: {owner: 'Foo', name: 'bar'},
        number: 10,
        headSha: 'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
      },
      'd38990d3d54749a1408e7ca29e139e3c9743aa2e',
      new Map([
        ['changelogversion\u002dutils', mockPackage('changelogversion-utils')],
        [
          'changelogversion',
          mockPackage('changelogversion', {
            changeSet: [
              {type: 'feat', title: 'Something awesome was added', body: ''},
            ],
          }),
        ],
        [
          'changelogversion\u002dserver',
          mockPackage('changelogversion-server'),
        ],
      ]),
      [],
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

    [Edit changelogs](https://example.com/Foo/bar/pull/10)"
  `);
});
