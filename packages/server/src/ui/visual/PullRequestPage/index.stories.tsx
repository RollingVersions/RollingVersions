import * as React from 'react';
import PullRequestPage from './';
import {PublishTarget, PackageInfo} from 'rollingversions/lib/types';
import {action} from '@storybook/addon-actions';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';

export default {title: 'pages/PullRequestPage'};

function packageInfo(
  info: Pick<PackageInfo, 'packageName'> & Partial<PackageInfo>,
): PackageInfo {
  return {
    path: 'fake-path',
    publishTarget: PublishTarget.npm,
    publishConfigAccess: 'public',
    notToBePublished: false,
    registryVersion: null,
    versionTag: null,
    ...info,
  };
}

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300">
      <PullRequestPage
        headSha="sdjfkasjfkdsjvoixjvof"
        readOnly={false}
        saving={false}
        packages={
          new Map([
            [
              '@databases/pg',
              {
                changes: getEmptyChangeSet(),
                info: [packageInfo({packageName: '@databases/pg'})],
              },
            ],
            [
              '@databases/mysql',
              {
                changes: getEmptyChangeSet(),
                info: [packageInfo({packageName: '@databases/mysql'})],
              },
            ],
          ])
        }
        unreleasedPackages={['@databases/pg', '@databases/mysql']}
        onSave={action('save')}
      />
    </div>
  );
};
