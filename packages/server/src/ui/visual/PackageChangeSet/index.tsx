import React, {useCallback} from 'react';

import type ChangeSet from '@rollingversions/change-set';
import {extractChanges} from '@rollingversions/change-set';
import {PublishTargetConfig} from '@rollingversions/types';

import Changes from '../Changes';
import RegistryStatus from '../RegistryStatus';

export interface PackageChangeSetProps {
  packageName: string;
  targetConfigs: readonly PublishTargetConfig[];
  changes: ChangeSet<{localId: number}>;
  disabled: boolean;
  readOnly: boolean;
  warning?: React.ReactNode;
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
  onChange,
}: PackageChangeSetProps) {
  const onChangeInner = useCallback((update) => onChange(packageName, update), [
    packageName,
    onChange,
  ]);
  // TODO(feat): allow alternative change types
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
        <Changes
          title="Breaking Changes"
          disabled={disabled}
          readOnly={readOnly}
          type="breaking"
          changes={extractChanges(changes, 'breaking')}
          onChange={onChangeInner}
        />
        <Changes
          title="New Features"
          disabled={disabled}
          readOnly={readOnly}
          type="feat"
          changes={extractChanges(changes, 'feat')}
          onChange={onChangeInner}
        />
        <Changes
          title="Refactors"
          disabled={disabled}
          readOnly={readOnly}
          type="refactor"
          changes={extractChanges(changes, 'refactor')}
          onChange={onChangeInner}
        />
        <Changes
          title="Bug Fixes"
          disabled={disabled}
          readOnly={readOnly}
          type="fix"
          changes={extractChanges(changes, 'fix')}
          onChange={onChangeInner}
        />
        <Changes
          title="Performance Improvements"
          disabled={disabled}
          readOnly={readOnly}
          type="perf"
          changes={extractChanges(changes, 'perf')}
          onChange={onChangeInner}
        />
      </div>
    </div>
  );
}
export default React.memo(PackageChangeSet);
