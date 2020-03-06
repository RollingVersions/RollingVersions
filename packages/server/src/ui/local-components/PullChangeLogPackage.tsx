import React from 'react';
import {PackageInfo} from '@changelogversion/utils/lib/Platforms';
import {PackagePullChangeLog} from '@changelogversion/utils/lib/PullChangeLog';
import RegistryStatus from './RegistryStatus';
import PullChangeLogEntrySection from './PullChangeLogEntrySection';
require('./PullChangeLogEntry.css');

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
      <RegistryStatus
        disabled={disabled}
        packageInfo={packageInfo}
        changeLog={changeLog}
        onChangeLogChange={onChangeLogChange}
      />
      <div className="flex">
        <div className="flex-grow" style={{flexBasis: 0}}>
          <PullChangeLogEntrySection
            type="breaking"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        </div>
        <div className="flex-grow" style={{flexBasis: 0}}>
          <PullChangeLogEntrySection
            type="feat"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />

          <PullChangeLogEntrySection
            type="refactor"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        </div>
        <div className="flex-grow" style={{flexBasis: 0}}>
          <PullChangeLogEntrySection
            type="fix"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />

          <PullChangeLogEntrySection
            type="perf"
            disabled={disabled}
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        </div>
      </div>
    </>
  );
}
