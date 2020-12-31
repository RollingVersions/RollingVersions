import {URL} from 'url';
import {PublishTarget} from 'rollingversions/lib/types';
import {renderCommentWithoutState} from '../Rendering';
import {PullRequestPackage} from '../../types';

function mockPackage(input: {
  manifests: (Pick<PullRequestPackage['manifests'][number], 'packageName'> &
    Partial<PullRequestPackage['manifests'][number]>)[];
  dependencies?: Partial<PullRequestPackage['dependencies']>;
  changeSet?: PullRequestPackage['changeSet'];
  released?: boolean;
}): PullRequestPackage {
  return {
    manifests: input.manifests.map((manifest) => ({
      path: `${manifest.packageName}/package.json`,
      targetConfig: {type: PublishTarget.npm, publishConfigAccess: 'public'},
      notToBePublished: true,
      registryVersion: null,
      versionTag: null,
      ...manifest,
    })),
    dependencies: {
      required: [],
      optional: [],
      development: [],
      ...input.dependencies,
    },
    changeSet: input.changeSet ?? [],
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
            manifests: [{packageName: 'changelogversion-utils'}],
          }),
        ],
        [
          'changelogversion',
          mockPackage({
            manifests: [{packageName: 'changelogversion'}],
            changeSet: [
              {type: 'feat', title: 'Something awesome was added', body: ''},
            ],
          }),
        ],
        [
          'changelogversion\u002dserver',
          mockPackage({
            manifests: [{packageName: 'changelogversion-server'}],
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
