import * as React from 'react';
import RegistryStatus from './';
import {PublishTarget} from 'rollingversions/lib/types';

export default {title: 'modules/RegistryStatus'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <RegistryStatus targetConfigs={[]} currentVersion={null} />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            path: '',
            packageName: '',
            private: true,
            publishConfigAccess: 'public',
          },
        ]}
        currentVersion={null}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            path: '',
            packageName: '',
            private: false,
            publishConfigAccess: 'public',
          },
        ]}
        currentVersion={null}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            path: '',
            packageName: '',
            private: false,
            publishConfigAccess: 'restricted',
          },
        ]}
        currentVersion={null}
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            path: '',
            packageName: '',
            private: false,
            publishConfigAccess: 'public',
          },
        ]}
        currentVersion="1.0.0"
      />
      <RegistryStatus
        targetConfigs={[
          {
            type: PublishTarget.npm,
            path: '',
            packageName: '',
            private: false,
            publishConfigAccess: 'restricted',
          },
        ]}
        currentVersion="1.0.0"
      />
    </div>
  );
};
