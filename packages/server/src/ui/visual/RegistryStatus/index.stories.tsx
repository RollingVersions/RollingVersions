import * as React from 'react';

import {PublishTarget} from '@rollingversions/types';

import RegistryStatus from '.';

export default {title: 'modules/RegistryStatus'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <RegistryStatus targetConfigs={[]} />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            private: true,
            publishConfigAccess: 'public',
            path: '',
            packageName: '',
          },
        ]}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            private: false,
            publishConfigAccess: 'public',
            path: '',
            packageName: '',
          },
        ]}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            private: false,
            publishConfigAccess: 'restricted',
            path: '',
            packageName: '',
          },
        ]}
      />
    </div>
  );
};
