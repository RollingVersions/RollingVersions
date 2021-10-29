import React, {useCallback} from 'react';

import type ChangeSet from '@rollingversions/change-set';
import {extractChanges} from '@rollingversions/change-set';
import {ChangeType, PublishTargetConfig} from '@rollingversions/types';

import Changes from '../Changes';
import RegistryStatus from '../RegistryStatus';

export interface PackageChangeSetProps {
  packageName: string;
  targetConfigs: readonly PublishTargetConfig[];
  changes: ChangeSet<{localId: number}>;
  disabled: boolean;
  readOnly: boolean;
  warning?: React.ReactNode;
  changeTypes: readonly ChangeType[];
  onChange: (
    packageName: string,
    update: (
      oldChanges: ChangeSet<{localId: number}>,
    ) => ChangeSet<{localId: number}>,
  ) => void;
}

function PackageChangeSet({
  targetConfigs,
  packageName,
  changes,
  disabled,
  readOnly,
  warning,
  changeTypes,
  onChange,
}: PackageChangeSetProps) {
  const onChangeInner = useCallback((update) => onChange(packageName, update), [
    packageName,
    onChange,
  ]);
  // TODO(feat): show warning if no changes are added and the commit has modified files in the directory
  // TODO(feat): show warning if dependencies have breaking changes but this package has no changes
  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      <div>
        <h2 className="font-sans text-3xl text-gray-900 font-light mb-4">
          {packageName}
        </h2>
        {warning}
        <RegistryStatus targetConfigs={targetConfigs} />
      </div>
      <div className="grid gap-4 lg:gap-8">
        {changeTypes.map((changeType) => (
          <Changes
            key={changeType.id}
            type={changeType.id}
            bumps={changeType.bumps}
            title={changeType.plural}
            disabled={disabled}
            readOnly={readOnly}
            changes={extractChanges(changes, changeType.id)}
            onChange={onChangeInner}
          />
        ))}
      </div>
    </div>
  );
}
export default React.memo(PackageChangeSet);
