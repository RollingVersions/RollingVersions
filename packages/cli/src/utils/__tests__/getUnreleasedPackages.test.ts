import listPackages from '../listPackages';
import getUnreleasedPackages from '../getUnreleasedPackages';
import {
  createRepository,
  createNpmPackage,
} from '../../services/__mock_services__';
import {getAllTags, getAllFiles} from '../../services/git';

test('getUnreleasedPackages', async () => {
  const {dirname, newPullRequest, newCommit} = createRepository({
    files: [
      {path: 'a/package.json', contents: '{"name": "example-package-a"}'},
      {path: 'b/package.json', contents: '{"name": "example-package-b"}'},
      {path: 'c/package.json', contents: '{"name": "example-package-c"}'},
    ],
  });
  const {pullRequest} = newPullRequest({closed: true, merged: true});

  // package-a and package-b were released before this PR was merged
  newCommit({
    tags: ['example-package-a@1.0.0', 'example-package-b@1.0.0'],
  });
  // package-a was released as part on this PR, but package-b and package-c were not
  newCommit({
    tags: ['example-package-a@2.0.0'],
    pullRequests: [pullRequest.number],
  });
  // package-c was released after this PR
  newCommit({
    tags: ['example-package-c@1.0.0'],
  });

  createNpmPackage('example-packge-a', {
    versions: ['1.0.0', '2.0.0'],
  });
  createNpmPackage('example-packge-b', {
    versions: ['1.0.0'],
  });
  createNpmPackage('example-packge-c', {
    versions: ['1.0.0'],
  });

  // the only package that does not have a release on or after this PR is package-b
  expect(
    await getUnreleasedPackages(
      null as any,
      {...pullRequest, closed: true},
      new Map(
        [
          ...(await listPackages(getAllTags(dirname), getAllFiles(dirname))),
        ].map(([packageName, info]) => [
          packageName,
          {changes: null as any, info},
        ]),
      ),
    ),
  ).toMatchInlineSnapshot(`
    Set {
      "example-package-b",
    }
  `);
});
