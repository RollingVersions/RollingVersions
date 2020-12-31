import React, {useCallback} from 'react';
import RegistryStatus, {RegistryStatusProps} from '../RegistryStatus';
import Changes from '../Changes';
import ChangeSet, {extractChanges} from '@rollingversions/change-set';

export interface PackageChangeSetProps {
  packageName: string;
  packageManifest: RegistryStatusProps['packageManifest'];
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
  packageManifest,
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
        <RegistryStatus packageManifest={packageManifest} />
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
