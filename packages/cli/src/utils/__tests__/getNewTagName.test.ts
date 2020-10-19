import {PublishTarget} from '../../types';
import PackageStatus from '../../types/PackageStatus';
import getNewTagName from '../getNewTagName';

test('getNewTagName', () => {
  expect(
    getNewTagName([], {
      status: PackageStatus.NewVersionToBePublished,
      packageName: 'my-package-name',
      currentVersion: null,
      newVersion: '1.0.0',
      changeSet: {breaking: [], feat: [], refactor: [], perf: [], fix: []},
      manifests: [
        {
          registryVersion: null,
          versionTag: null,
          path: 'some/path',
          packageName: 'my-package-name',
          notToBePublished: false,
          targetConfig: {
            type: PublishTarget.custom_script,
            publish: 'echo published',
            tag_format: '{{MAJOR}}/{{MINOR}}/{{PATCH}}',
          },
        },
      ],
      dependencies: {required: [], optional: [], development: []},
    }),
  ).toMatchInlineSnapshot(`"1/0/0"`);

  expect(
    getNewTagName([], {
      status: PackageStatus.NewVersionToBePublished,
      packageName: 'my-package-name',
      currentVersion: null,
      newVersion: '1.0.0',
      changeSet: {breaking: [], feat: [], refactor: [], perf: [], fix: []},
      manifests: [
        {
          registryVersion: null,
          versionTag: null,
          path: 'some/path',
          packageName: 'my-package-name',
          notToBePublished: false,
          targetConfig: {
            type: PublishTarget.custom_script,
            publish: 'echo published',
            tag_format:
              '{{MAJOR | pad-number 4}}/{{MINOR | pad-number 3}}/{{PATCH | pad-number 6}}',
          },
        },
      ],
      dependencies: {required: [], optional: [], development: []},
    }),
  ).toMatchInlineSnapshot(`"0001/000/000000"`);
});
