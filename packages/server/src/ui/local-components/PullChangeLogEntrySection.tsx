import React from 'react';
import {
  PackagePullChangeLog,
  ChangeType,
  SectionTitle,
  ChangeLogEntry,
} from '@rollingversions/utils/lib/PullChangeLog';
import ChangeInput, {ChangeInputList} from '../visual/ChangeInput';
import Changes from '../visual/Changes';

interface PullChangeLogEntrySectionProps {
  type: ChangeType;
  changeLog: PackagePullChangeLog;
  disabled: boolean;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}
function upsertChange(
  changes: ChangeLogEntry[],
  oldEntry: ChangeLogEntry,
  update: {title: string; body: string},
) {
  return changes.includes(oldEntry)
    ? changes.map((c) => (c === oldEntry ? {...oldEntry, ...update} : c))
    : [...changes, {...oldEntry, ...update}];
}
export default function PullChangeLogEntrySection({
  type,
  changeLog,
  disabled,
  onChangeLogChange,
}: PullChangeLogEntrySectionProps) {
  return (
    <Changes title={SectionTitle[type]}>
      <ChangeInputList>
        {[
          ...changeLog.changes.filter((c) => c.type === type),
          ...(disabled ? [] : [{type, title: '', body: ''}]),
        ].map((entry, i) => (
          <ChangeInput
            key={i}
            title={entry.title}
            body={entry.body}
            disabled={disabled}
            onChange={(update) => {
              onChangeLogChange({
                ...changeLog,
                changes: upsertChange(changeLog.changes, entry, update),
              });
            }}
            onBlur={() => {
              if (!entry.title && !entry.body) {
                onChangeLogChange({
                  ...changeLog,
                  changes: changeLog.changes.filter((c) => c !== entry),
                });
              }
            }}
          />
        ))}
      </ChangeInputList>
    </Changes>
  );
}
