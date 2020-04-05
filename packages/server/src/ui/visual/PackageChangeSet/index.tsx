import React from 'react';
import {ChangeLogEntry} from '@rollingversions/utils/lib/PullChangeLog';
import RegistryStatus, {RegistryStatusProps} from '../RegistryStatus';
import ChangeSetEditorLayout from '../ChangeSetEditorLayout';
import Changes from '../Changes';

export interface PackageChangeSetProps {
  packageName: string;
  packageInfo: RegistryStatusProps['packageInfo'];
  changes: (ChangeLogEntry & {localId: number})[];
  disabled: boolean;
  onChange: (changes: (ChangeLogEntry & {localId: number})[]) => void;
}
export default function PackageChangeSet({
  packageInfo,
  packageName,
  changes,
  disabled,
  onChange,
}: PackageChangeSetProps) {
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
            type="breaking"
            title="Breaking Changes"
            disabled={disabled}
            changes={changes}
            onChange={onChange}
          />
        }
        feat={
          <Changes
            type="feat"
            title="New Features"
            disabled={disabled}
            changes={changes}
            onChange={onChange}
          />
        }
        refactor={
          <Changes
            type="refactor"
            title="Refactors"
            disabled={disabled}
            changes={changes}
            onChange={onChange}
          />
        }
        fix={
          <Changes
            type="fix"
            title="Bug Fixes"
            disabled={disabled}
            changes={changes}
            onChange={onChange}
          />
        }
        perf={
          <Changes
            type="perf"
            title="Performance Improvements"
            disabled={disabled}
            changes={changes}
            onChange={onChange}
          />
        }
      />
    </>
  );
}
