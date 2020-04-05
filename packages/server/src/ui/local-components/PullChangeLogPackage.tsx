import React from 'react';
import {PackageInfo} from '@rollingversions/utils/lib/Platforms';
import {PackagePullChangeLog} from '@rollingversions/utils/lib/PullChangeLog';
import RegistryStatus from '../visual/RegistryStatus';
import PullChangeLogEntrySection from './PullChangeLogEntrySection';
import ChangeSetEditorLayout from '../visual/ChangeSetEditorLayout';

interface PullChangeLogPackageProps {
  packageInfo: PackageInfo[];
  changeLog: PackagePullChangeLog;
  disabled: boolean;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}
export default function PullChangeLogPackage({
  packageInfo,
  changeLog,
  disabled,
  onChangeLogChange,
}: PullChangeLogPackageProps) {
  const title = (
    <h2 className="font-sans text-3xl text-blue-800 font-light mt-8 mb-4">
      {changeLog.packageName}
    </h2>
  );

  // TODO: show warning if no changes are added and the commit has modified files in the directory
  return (
    <>
      {title}
      <RegistryStatus packageInfo={packageInfo} />
      <ChangeSetEditorLayout
        breaking={
          <PullChangeLogEntrySection
            type="breaking"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        }
        feat={
          <PullChangeLogEntrySection
            type="feat"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        }
        refactor={
          <PullChangeLogEntrySection
            type="refactor"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        }
        fix={
          <PullChangeLogEntrySection
            type="fix"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        }
        perf={
          <PullChangeLogEntrySection
            type="perf"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        }
      />
    </>
  );
}
