import * as React from 'react';
import PackageChangeSet from './';
import {PublishTarget} from 'rollingversions/lib/types';
import getEmptyChangeSet from 'rollingversions/lib/utils/getEmptyChangeSet';

export default {title: 'modules/PackageChangeSet'};

export const Default = () => {
  const [changes, setChanges] = React.useState(
    getEmptyChangeSet<{localId: number}>(),
  );
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <PackageChangeSet
        packageName="@databases/pg"
        packageManifest={[
          {
            publishTarget: PublishTarget.npm,
            notToBePublished: false,
            versionTag: null,
            registryVersion: null,
            targetConfig: {publishConfigAccess: 'public'},
          },
        ]}
        changes={changes}
        disabled={false}
        readOnly={false}
        onChange={(_packageName, update) => setChanges(update)}
      />
    </div>
  );
};
