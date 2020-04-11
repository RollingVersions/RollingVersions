import React from 'react';
import {ChangeLogEntry, ChangeSet} from 'rollingversions/lib/types';
import RegistryStatus, {RegistryStatusProps} from '../RegistryStatus';
import ChangeSetEditorLayout from '../ChangeSetEditorLayout';
import Changes from '../Changes';

export interface PackageChangeSetProps {
  packageName: string;
  packageInfo: RegistryStatusProps['packageInfo'];
  changes: ChangeSet<{localId: number}>;
  disabled: boolean;
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
  packageInfo,
  packageName,
  changes,
  disabled,
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
    <>
      <h2 className="font-sans text-3xl text-blue-800 font-light mt-8 mb-4">
        {packageName}
      </h2>
      <RegistryStatus packageInfo={packageInfo} />
      <ChangeSetEditorLayout
        breaking={
          <Changes
            title="Breaking Changes"
            disabled={disabled}
            changes={changes.breaking}
            onChange={handleChange.breaking}
          />
        }
        feat={
          <Changes
            title="New Features"
            disabled={disabled}
            changes={changes.feat}
            onChange={handleChange.feat}
          />
        }
        refactor={
          <Changes
            title="Refactors"
            disabled={disabled}
            changes={changes.refactor}
            onChange={handleChange.refactor}
          />
        }
        fix={
          <Changes
            title="Bug Fixes"
            disabled={disabled}
            changes={changes.fix}
            onChange={handleChange.fix}
          />
        }
        perf={
          <Changes
            title="Performance Improvements"
            disabled={disabled}
            changes={changes.perf}
            onChange={handleChange.perf}
          />
        }
      />
    </>
  );
}
export default React.memo(PackageChangeSet);
