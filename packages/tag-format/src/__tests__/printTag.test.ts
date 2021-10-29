import {printTag} from '..';

test('printTag', () => {
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: null,
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`my-package-name@1.0.0`);
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: 'my-package-name@v0.0.0',
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`my-package-name@v1.0.0`);
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: 'v0.0.0',
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`v1.0.0`);
  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: '0.0.0',
        tagFormat: undefined,
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`1.0.0`);

  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: null,
        tagFormat: '{{MAJOR}}/{{MINOR}}/{{PATCH}}',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`1/0/0`);

  expect(
    printTag(
      {
        numerical: [1, 0, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        oldTagName: null,
        tagFormat:
          '{{MAJOR | pad-number 4}}/{{MINOR | pad-number 3}}/{{PATCH | pad-number 6}}',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
      },
    ),
  ).toBe(`0001/000/000000`);
});

test('Custom tag format with optional sections', () => {
  expect(
    printTag(
      {
        numerical: [1, 2, 3],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
        oldTagName: null,
        tagFormat: '{{MAJOR}}.{{MINOR}}{{?.{{PATCH}}}}',
      },
    ),
  ).toEqual(`1.2.3`);

  expect(
    printTag(
      {
        numerical: [1, 2, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
        oldTagName: null,
        tagFormat: '{{MAJOR}}.{{MINOR}}.{{PATCH}}',
      },
    ),
  ).toEqual(`1.2.0`);

  expect(
    printTag(
      {
        numerical: [1, 2, 0],
        prerelease: [],
        build: [],
      },
      {
        packageName: 'my-package-name',
        versionSchema: ['MAJOR', 'MINOR', 'PATCH'],
        oldTagName: null,
        tagFormat: '{{MAJOR}}.{{MINOR}}{{?.{{PATCH}}}}',
      },
    ),
  ).toEqual(`1.2`);
});
