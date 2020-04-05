import * as React from 'react';
import PullRequestPage from './';
import {Platform} from '@rollingversions/utils/lib/Platforms';
import {action} from '@storybook/addon-actions';

export default {title: 'pages/PullRequestPage'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300">
      <PullRequestPage
        headSha="sdjfkasjfkdsjvoixjvof"
        readOnly={false}
        saving={false}
        currentVersions={{
          '@databases/pg': [
            {
              platform: Platform.npm,
              notToBePublished: false,
              versionTag: null,
              registryVersion: null,
              publishConfigAccess: 'public' as 'public' | 'restricted',
            },
          ],
          '@databases/mysql': [
            {
              platform: Platform.npm,
              notToBePublished: false,
              versionTag: null,
              registryVersion: null,
              publishConfigAccess: 'public' as 'public' | 'restricted',
            },
          ],
        }}
        packages={[
          {packageName: '@databases/pg', changes: []},
          {packageName: '@databases/mysql', changes: []},
        ]}
        onSave={action('save')}
      />
    </div>
  );
};
