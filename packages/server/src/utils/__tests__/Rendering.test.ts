import {URL} from 'url';
import {PublishTarget} from 'rollingversions/lib/types';
import {createEmptyChangeSet} from 'rollingversions/lib/types/ChangeSet';
import {renderCommentWithoutState} from '../Rendering';
import {PullRequestPackage} from '../../types';

function mockPackage(input: {
  pkg: Pick<PullRequestPackage['pkg'], 'packageName'> &
    Partial<PullRequestPackage['pkg']>;
  currentVersion?: string;
  changeSet?: Partial<PullRequestPackage['changeSet']>;
  released?: boolean;
}): PullRequestPackage {
  return {
    pkg: {
      packageName: input.pkg.packageName,
      dependencies: input.pkg.dependencies ?? {
        required: [],
        optional: [],
        development: [],
      },
      targetConfigs: [
        {
          type: PublishTarget.npm,
          packageName: input.pkg.packageName,
          path: `${input.pkg.packageName}/package.json`,
          private: false,
          publishConfigAccess: 'public',
        },
      ],
      // ...manifest,
    },
    currentVersion: input.currentVersion ?? null,
    changeSet: {
      ...createEmptyChangeSet(),
      ...input.changeSet,
    },
    released: input.released === undefined ? false : input.released,
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
        [
          'changelogversion\u002dutils',
          mockPackage({
            pkg: {packageName: 'changelogversion-utils'},
          }),
        ],
        [
          'changelogversion',
          mockPackage({
            pkg: {packageName: 'changelogversion'},
            changeSet: {
              feat: [{title: 'Something awesome was added', body: ''}],
            },
          }),
        ],
        [
          'changelogversion\u002dserver',
          mockPackage({
            pkg: {packageName: 'changelogversion-server'},
          }),
        ],
      ]),
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
