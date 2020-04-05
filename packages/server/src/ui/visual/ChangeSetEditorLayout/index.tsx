import React from 'react';

export interface ChangeSetEditorLayoutProps {
  breaking: React.ReactNode;
  feat: React.ReactNode;
  refactor: React.ReactNode;
  fix: React.ReactNode;
  perf: React.ReactNode;
}
export default function ChangeSetEditorLayout({
  breaking,
  feat,
  refactor,
  fix,
  perf,
}: ChangeSetEditorLayoutProps) {
  return (
    <div className="grid gap-4 lg:gap-8 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <div className="lg:col-span-2 xl:col-span-1 xl:row-span-2">
        {breaking}
      </div>
      <div className="xl:row-start-1 xl:col-start-2">{feat}</div>
      <div className="xl:row-start-2 xl:col-start-2">{refactor}</div>
      <div className="xl:row-start-1 xl:col-start-3">{fix}</div>
      <div className="xl:row-start-2 xl:col-start-3">{perf}</div>
    </div>
  );
}
