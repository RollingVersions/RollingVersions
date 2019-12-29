import React from 'react';
import {PackageInfo} from 'changelogversion-utils/lib/Platforms';
import {PackagePullChangeLog} from 'changelogversion-utils/lib/PullChangeLog';
import RegistryStatus, {publishingSettingsChosen} from './RegistryStatus';
import PullChangeLogEntrySection from './PullChangeLogEntrySection';
require('./PullChangeLogEntry.css');

interface PullChangeLogPackageProps {
  packageInfo: PackageInfo[];
  changeLog: PackagePullChangeLog;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}
export default function PullChangeLogPackage({
  packageInfo,
  changeLog,
  onChangeLogChange,
}: PullChangeLogPackageProps) {
  const title = (
    <h2 className="font-sans text-3xl text-blue-800 font-light mt-4">
      {changeLog.packageName}
    </h2>
  );
  if (!publishingSettingsChosen({packageInfo, changeLog})) {
    return (
      <>
        {title}
        <RegistryStatus
          packageInfo={packageInfo}
          changeLog={changeLog}
          onChangeLogChange={onChangeLogChange}
        />
      </>
    );
  }

  // TODO: add the ability to add changes here
  return (
    <>
      {title}
      <RegistryStatus
        packageInfo={packageInfo}
        changeLog={changeLog}
        onChangeLogChange={onChangeLogChange}
      />
      <div className="flex">
        <div className="flex-grow">
          <PullChangeLogEntrySection
            type="breaking"
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        </div>
        <div className="flex-grow">
          <PullChangeLogEntrySection
            type="feat"
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />

          <PullChangeLogEntrySection
            type="refactor"
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        </div>
        <div className="flex-grow">
          <PullChangeLogEntrySection
            type="fix"
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />

          <PullChangeLogEntrySection
            type="perf"
            changeLog={changeLog}
            onChangeLogChange={onChangeLogChange}
          />
        </div>
      </div>
    </>
  );
}
