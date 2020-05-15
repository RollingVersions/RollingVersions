import React from 'react';
import {ChangeLogEntry, ChangeSet} from 'rollingversions/lib/types';
import RegistryStatus, {RegistryStatusProps} from '../RegistryStatus';
import ChangeSetEditorLayout from '../ChangeSetEditorLayout';
import Changes from '../Changes';

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

function useOnChange(
  packageName: string,
  type: keyof ChangeSet,
  onChange: PackageChangeSetProps['onChange'],
) {
  return React.useCallback(
    (changes: (ChangeLogEntry & {localId: number})[]) => {
      onChange(packageName, (oldChanges) => ({...oldChanges, [type]: changes}));
    },
    [packageName, type, onChange],
  );
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
  const handleChange = {
    breaking: useOnChange(packageName, 'breaking', onChange),
    feat: useOnChange(packageName, 'feat', onChange),
    refactor: useOnChange(packageName, 'refactor', onChange),
    fix: useOnChange(packageName, 'fix', onChange),
    perf: useOnChange(packageName, 'perf', onChange),
  };
  // TODO: show warning if no changes are added and the commit has modified files in the directory
  return (
    <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
      <div>
        <h2 className="font-sans text-3xl text-gray-900 font-light mb-4">
          {packageName}
        </h2>
        {warning}
        <RegistryStatus packageManifest={packageManifest} />
      </div>
      <ChangeSetEditorLayout
        breaking={
          <Changes
            title="Breaking Changes"
            disabled={disabled}
            readOnly={readOnly}
            changes={changes.breaking}
            onChange={handleChange.breaking}
          />
        }
        feat={
          <Changes
            title="New Features"
            disabled={disabled}
            readOnly={readOnly}
            changes={changes.feat}
            onChange={handleChange.feat}
          />
        }
        refactor={
          <Changes
            title="Refactors"
            disabled={disabled}
            readOnly={readOnly}
            changes={changes.refactor}
            onChange={handleChange.refactor}
          />
        }
        fix={
          <Changes
            title="Bug Fixes"
            disabled={disabled}
            readOnly={readOnly}
            changes={changes.fix}
            onChange={handleChange.fix}
          />
        }
        perf={
          <Changes
            title="Performance Improvements"
            disabled={disabled}
            readOnly={readOnly}
            changes={changes.perf}
            onChange={handleChange.perf}
          />
        }
      />
    </div>
  );
}
export default React.memo(PackageChangeSet);
