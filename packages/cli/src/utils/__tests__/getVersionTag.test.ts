import getVersionTag from '../getVersionTag';

test('getVersionTag', () => {
  expect(
    getVersionTag([{name: 'foo-bar'}], 'my-package', null, {
      repoHasMultiplePackages: false,
      tagFormat: null,
    }),
  ).toMatchInlineSnapshot(`null`);
  expect(
    getVersionTag([{name: 'foo-bar'}], 'my-package', '1.0.0', {
      repoHasMultiplePackages: false,
      tagFormat: null,
    }),
  ).toMatchInlineSnapshot(`null`);
  expect(
    getVersionTag([{name: '1.0.0'}], 'my-package', '1.0.0', {
      repoHasMultiplePackages: false,
      tagFormat: null,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "name": "1.0.0",
      "version": "1.0.0",
    }
  `);
  expect(
    getVersionTag([{name: 'my-package@1.0.0'}], 'my-package', '1.0.0', {
      repoHasMultiplePackages: false,
      tagFormat: null,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "name": "my-package@1.0.0",
      "version": "1.0.0",
    }
  `);
  expect(
    getVersionTag([{name: '1.0.0'}], 'my-package', '1.0.0', {
      repoHasMultiplePackages: true,
      tagFormat: null,
    }),
  ).toMatchInlineSnapshot(`null`);
  expect(
    getVersionTag([{name: 'my-package@1.0.0'}], 'my-package', '1.0.0', {
      repoHasMultiplePackages: true,
      tagFormat: null,
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "name": "my-package@1.0.0",
      "version": "1.0.0",
    }
  `);
});

test('Custom tag format', () => {
  expect(
    getVersionTag([{name: '0-4-5'}], 'my-package', null, {
      repoHasMultiplePackages: true,
      tagFormat: '{{PATCH}}-{{MINOR}}-{{MAJOR}}',
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "name": "0-4-5",
      "version": "5.4.0",
    }
  `);
  expect(
    getVersionTag([{name: '0-4-5'}], 'my-package', '5.4.0', {
      repoHasMultiplePackages: true,
      tagFormat: '{{PATCH}}-{{MINOR}}-{{MAJOR}}',
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "name": "0-4-5",
      "version": "5.4.0",
    }
  `);
  expect(
    getVersionTag([{name: 'before-0-4-5-after'}], 'my-package', '5.4.0', {
      repoHasMultiplePackages: true,
      tagFormat: 'before-{{PATCH}}-{{MINOR}}-{{MAJOR}}-after',
    }),
  ).toMatchInlineSnapshot(`
    Object {
      "name": "before-0-4-5-after",
      "version": "5.4.0",
    }
  `);
});

// import {valid, prerelease, gt} from 'semver';
// import isTruthy from '../ts-utils/isTruthy';
// import parseVersionTagTemplate from './parseVersionTagTemplate';

// export default function getVersionTag<Tag extends {readonly name: string}>(
//   allTags: readonly Tag[],
//   packageName: string,
//   registryVersion: string | null,
//   {isMonoRepo, tagFormat}: {isMonoRepo: boolean; tagFormat: string | null},
// ): (Tag & {version: string}) | null {

// }
