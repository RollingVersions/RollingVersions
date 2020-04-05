import * as React from 'react';
import PackageChangeSet from './';
import {Platform} from '@rollingversions/utils/lib/Platforms';
import {ChangeLogEntry} from '@rollingversions/utils/lib/PullChangeLog';

export default {title: 'modules/PackageChangeSet'};

export const Default = () => {
  const [changes, setChanges] = React.useState<
    (ChangeLogEntry & {
      localId: number;
    })[]
  >([]);
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <PackageChangeSet
        packageName="@databases/pg"
        packageInfo={[
          {
            platform: Platform.npm,
            notToBePublished: false,
            versionTag: null,
            registryVersion: null,
            publishConfigAccess: 'public',
          },
        ]}
        changes={changes}
        disabled={false}
        onChange={setChanges}
      />
    </div>
  );
};
