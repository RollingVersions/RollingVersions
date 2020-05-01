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
    <div className="grid gap-4 lg:gap-8">
      {breaking}
      {feat}
      {refactor}
      {fix}
      {perf}
    </div>
  );
}
