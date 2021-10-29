import * as React from 'react';

import {createChangeSet} from '@rollingversions/change-set';
import {DEFAULT_CHANGE_TYPES} from '@rollingversions/config';
import {PublishTarget} from '@rollingversions/types';

import PackageChangeSet from '.';

export default {title: 'modules/PackageChangeSet'};

export const Default = () => {
  const [changes, setChanges] = React.useState(
    createChangeSet<{localId: number}>(),
  );
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <PackageChangeSet
        packageName="@databases/pg"
        targetConfigs={[
          {
            type: PublishTarget.npm,
            publishConfigAccess: 'public',
            packageName: '@databases/pg',
            path: 'fake-path',
            private: false,
          },
        ]}
        changes={changes}
        changeTypes={DEFAULT_CHANGE_TYPES}
        disabled={false}
        readOnly={false}
        onChange={(_packageName, update) => setChanges(update)}
      />
    </div>
  );
};
