import React from 'react';
import {
  PackagePullChangeLog,
  Placeholder,
  ChangeLogEntry,
} from 'changelogversion-utils/lib/PullChangeLog';
import GitHubMarkdown from '../generic-components/GitHubMarkdownAsync';

const inc = (v: number) => v + 1;
const dec = (v: number) => v - 1;
interface PullChangeLogEntrySectionProps {
  entry: ChangeLogEntry;
  changeLog: PackagePullChangeLog;
  disabled: boolean;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}
export default function PullChangeLogChange({
  entry,
  changeLog,
  disabled,
  onChangeLogChange,
}: PullChangeLogEntrySectionProps) {
  const [focused, setFocused] = React.useState(0);
  return (
    <li>
      <div style={{position: 'relative', minHeight: '1.8125rem'}}>
        {entry.title ? (
          <GitHubMarkdown source={entry.title} />
        ) : (
          <span style={{color: 'gray'}}>{Placeholder[entry.type]}</span>
        )}
        {!disabled && (
          <input
            className={
              'PullChangeLogEntry__TitleInput' +
              (entry.body.trim() && !entry.title.trim()
                ? ' outline-none border-2 border-red-700'
                : '')
            }
            value={entry.title}
            placeholder={Placeholder[entry.type]}
            onChange={(e) => {
              onChangeLogChange({
                ...changeLog,
                changes: changeLog.changes.includes(entry)
                  ? changeLog.changes.map((c) =>
                      c === entry ? {...entry, title: e.target.value} : c,
                    )
                  : [...changeLog.changes, {...entry, title: e.target.value}],
              });
            }}
            onFocus={() => setFocused(inc)}
            onBlur={(e) => {
              setFocused(dec);
              if (!e.target.value.trim()) {
                if (entry.body.trim()) {
                  e.target.focus();
                } else if (changeLog.changes.includes(entry)) {
                  onChangeLogChange({
                    ...changeLog,
                    changes: changeLog.changes.filter((c) => c !== entry),
                  });
                }
              }
            }}
          />
        )}
      </div>
      <div
        style={{
          position: 'relative',
          minHeight: '2rem',
          opacity: focused || entry.body.trim() ? 1 : 0,
        }}
      >
        {entry.body ? (
          <GitHubMarkdown source={entry.body} />
        ) : (
          <span style={{color: 'gray'}}>Optional details</span>
        )}

        {!disabled && (
          <textarea
            className="PullChangeLogEntry__TitleInput"
            value={entry.body}
            placeholder="Optional Details"
            onFocus={() => setFocused(inc)}
            onBlur={() => setFocused(dec)}
            onChange={(e) => {
              onChangeLogChange({
                ...changeLog,
                changes: changeLog.changes.includes(entry)
                  ? changeLog.changes.map((c) =>
                      c === entry ? {...entry, body: e.target.value} : c,
                    )
                  : [...changeLog.changes, {...entry, body: e.target.value}],
              });
            }}
          />
        )}
      </div>
    </li>
  );
}
