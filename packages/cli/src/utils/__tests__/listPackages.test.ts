import listPackages from '../listPackages';
import {
  createRepository,
  createNpmPackage,
} from '../../services/__mock_services__';
import {getAllTags, getAllFiles} from '../../services/git';

test('listPackages - single npm package', async () => {
  const {dirname, newCommit} = createRepository({
    files: [{path: 'package.json', contents: '{"name": "example-package"}'}],
  });
  expect(await listPackages(getAllTags(dirname), getAllFiles(dirname)))
    .toMatchInlineSnapshot(`
    Map {
      "example-package" => Array [
        Object {
          "notToBePublished": false,
          "packageName": "example-package",
          "path": "package.json",
          "publishConfigAccess": "public",
          "publishTarget": "npm",
          "registryVersion": null,
          "versionTag": null,
        },
      ],
    }
  `);
  newCommit({tags: ['1.0.0']});
  newCommit({tags: ['2.0.0']});
  newCommit({tags: ['3.0.0']});
  createNpmPackage('example-package', {versions: ['2.0.0']});
  expect(await listPackages(getAllTags(dirname), getAllFiles(dirname)))
    .toMatchInlineSnapshot(`
    Map {
      "example-package" => Array [
        Object {
          "notToBePublished": false,
          "packageName": "example-package",
          "path": "package.json",
          "publishConfigAccess": "public",
          "publishTarget": "npm",
          "registryVersion": "2.0.0",
          "versionTag": Object {
            "commitSha": "COMMIT_SHA_2",
            "name": "2.0.0",
            "version": "2.0.0",
          },
        },
      ],
    }
  `);
});
