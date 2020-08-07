import listPackages from '../listPackages';
import {createRepository} from '../../services/__mock_services__';
import {getAllFiles} from '../../services/git';

test('listPackages - single npm package', async () => {
  const {dirname} = createRepository({
    files: [{path: 'package.json', contents: '{"name": "example-package"}'}],
  });
  expect(await listPackages(getAllFiles(dirname))).toMatchInlineSnapshot(`
    Map {
      "example-package" => Object {
        "dependencies": Object {
          "development": Array [],
          "optional": Array [],
          "required": Array [],
        },
        "manifests": Array [
          Object {
            "notToBePublished": false,
            "packageName": "example-package",
            "path": "package.json",
            "publishTarget": "npm",
            "targetConfig": Object {
              "publishConfigAccess": "public",
            },
          },
        ],
      },
    }
  `);
});

test('listPackages - multiple npm packages', async () => {
  const {dirname} = createRepository({
    files: [
      {
        path: 'package.json',
        contents: '{"name": "root-package", "@rollingversions/ignore": true}',
      },
      {
        path: 'package.json',
        contents: '{"name": "@root-package/a"}',
      },
      {
        path: 'package.json',
        contents: '{"name": "@root-package/b"}',
      },
    ],
  });
  expect(await listPackages(getAllFiles(dirname))).toMatchInlineSnapshot(`
    Map {
      "@root-package/a" => Object {
        "dependencies": Object {
          "development": Array [],
          "optional": Array [],
          "required": Array [],
        },
        "manifests": Array [
          Object {
            "notToBePublished": false,
            "packageName": "@root-package/a",
            "path": "package.json",
            "publishTarget": "npm",
            "targetConfig": Object {
              "publishConfigAccess": "restricted",
            },
          },
        ],
      },
      "@root-package/b" => Object {
        "dependencies": Object {
          "development": Array [],
          "optional": Array [],
          "required": Array [],
        },
        "manifests": Array [
          Object {
            "notToBePublished": false,
            "packageName": "@root-package/b",
            "path": "package.json",
            "publishTarget": "npm",
            "targetConfig": Object {
              "publishConfigAccess": "restricted",
            },
          },
        ],
      },
    }
  `);
});
