import * as React from 'react';
import RegistryStatus from './';
import {PublishTarget} from 'rollingversions/lib/types';

export default {title: 'modules/RegistryStatus'};

export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <RegistryStatus packageManifest={[]} />
      <RegistryStatus
        packageManifest={[
          {
            notToBePublished: true,
            versionTag: null,
            registryVersion: null,
            targetConfig: {
              type: PublishTarget.npm,
              publishConfigAccess: 'public',
            },
          },
        ]}
      />
      <RegistryStatus
        packageManifest={[
          {
            notToBePublished: false,
            versionTag: null,
            registryVersion: null,
            targetConfig: {
              type: PublishTarget.npm,
              publishConfigAccess: 'public',
            },
          },
        ]}
      />
      <RegistryStatus
        packageManifest={[
          {
            notToBePublished: false,
            versionTag: null,
            registryVersion: null,
            targetConfig: {
              type: PublishTarget.npm,
              publishConfigAccess: 'restricted',
            },
          },
        ]}
      />
      <RegistryStatus
        packageManifest={[
          {
            notToBePublished: false,
            versionTag: {
              name: 'my-package@1.0.0',
              version: '1.0.0',
            },
            registryVersion: '1.0.0',
            targetConfig: {
              type: PublishTarget.npm,
              publishConfigAccess: 'public',
            },
          },
        ]}
      />
      <RegistryStatus
        packageManifest={[
          {
            notToBePublished: false,
            versionTag: {
              name: 'my-package@1.0.0',
              version: '1.0.0',
            },
            registryVersion: '1.0.0',
            targetConfig: {
              type: PublishTarget.npm,
              publishConfigAccess: 'restricted',
            },
          },
        ]}
      />
    </div>
  );
};
