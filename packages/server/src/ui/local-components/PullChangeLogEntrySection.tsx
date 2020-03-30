import React from 'react';
import {
  PackagePullChangeLog,
  ChangeType,
  SectionTitle,
} from '@rollingversions/utils/lib/PullChangeLog';
import PullChangeLogChange from './PullChangeLogChange';

interface PullChangeLogEntrySectionProps {
  type: ChangeType;
  changeLog: PackagePullChangeLog;
  disabled: boolean;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}
export default function PullChangeLogEntrySection({
  type,
  changeLog,
  disabled,
  onChangeLogChange,
}: PullChangeLogEntrySectionProps) {
  return (
    <>
      <h3 className="font-sans text-xl text-blue-600 font-light mb-2 mt-6">
        {SectionTitle[type]}
      </h3>
      <ul className="list-disc p-4">
        {[
          ...changeLog.changes.filter((c) => c.type === type),
          {type, title: '', body: ''},
        ].map((entry, i) => (
          <PullChangeLogChange
            key={i}
            entry={entry}
            changeLog={changeLog}
            disabled={disabled}
            onChangeLogChange={onChangeLogChange}
          />
        ))}
      </ul>
    </>
  );
}
