import React = require('react');
import {
  PackagePullChangeLog,
  ChangeType,
  SectionTitle,
  Placeholder,
} from 'changelogversion-utils/lib/PullChangeLog';
import Markdown = require('react-markdown');
import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-async-light';
import SyntaxHighlighterStyle from 'react-syntax-highlighter/dist/esm/styles/prism/ghcolors';
const SyntaxHighligherSupportedLanguages: string[] = require('react-syntax-highlighter/dist/esm/languages/prism/supported-languages')
  .default;

interface PullChangeLogEntrySectionProps {
  type: ChangeType;
  changeLog: PackagePullChangeLog;
  onChangeLogChange: (log: PackagePullChangeLog) => void;
}
export default function PullChangeLogEntrySection({
  type,
  changeLog,
  onChangeLogChange,
}: PullChangeLogEntrySectionProps) {
  return (
    <>
      <h3 className="font-sans text-xl text-blue-600 font-light">
        {SectionTitle[type]}
      </h3>
      <ul className="list-disc p-4">
        {[
          ...changeLog.changes.filter((c) => c.type === type),
          {type, title: '', body: ''},
        ].map((entry, i) => (
          <li key={i}>
            <div style={{position: 'relative'}}>
              {entry.title ? (
                <Markdown className="markdown" source={entry.title} />
              ) : (
                <span style={{color: 'gray'}}>{Placeholder[type]}</span>
              )}
              <input
                className="PullChangeLogEntry__TitleInput"
                value={entry.title}
                placeholder={Placeholder[type]}
                onChange={(e) => {
                  onChangeLogChange({
                    ...changeLog,
                    changes: changeLog.changes.includes(entry)
                      ? changeLog.changes.map((c) =>
                          c === entry ? {...entry, title: e.target.value} : c,
                        )
                      : [
                          ...changeLog.changes,
                          {...entry, title: e.target.value},
                        ],
                  });
                  // do nothing
                }}
              />
            </div>
            {entry.title && (
              <div style={{position: 'relative'}}>
                {entry.body ? (
                  <Markdown
                    className="markdown"
                    source={entry.body}
                    renderers={{
                      code: (props) => {
                        const aliases = {
                          ts: 'typescript',
                          js: 'javascript',
                        };
                        const language: string | null = props.language
                          ? props.language.toLowerCase() in aliases
                            ? (aliases as any)[props.language.toLowerCase()]
                            : props.language.toLowerCase()
                          : null;
                        return (
                          <SyntaxHighlighter
                            style={SyntaxHighlighterStyle}
                            language={
                              language &&
                              SyntaxHighligherSupportedLanguages.includes(
                                language,
                              )
                                ? language
                                : 'text'
                            }
                            children={props.value}
                          />
                        );
                      },
                    }}
                  />
                ) : (
                  <span style={{color: 'gray'}}>Optional details</span>
                )}

                <textarea
                  className="PullChangeLogEntry__TitleInput"
                  value={entry.body}
                  placeholder="Optional Details"
                  onChange={(e) => {
                    onChangeLogChange({
                      ...changeLog,
                      changes: changeLog.changes.includes(entry)
                        ? changeLog.changes.map((c) =>
                            c === entry ? {...entry, body: e.target.value} : c,
                          )
                        : [
                            ...changeLog.changes,
                            {...entry, body: e.target.value},
                          ],
                    });
                    // do nothing
                  }}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
