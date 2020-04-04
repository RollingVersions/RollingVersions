import React from 'react';

interface PullChangeLogEntrySectionProps {
  title: string;
  children: React.ReactNode;
}
export default function PullChangeLogEntrySection({
  title,
  children,
}: PullChangeLogEntrySectionProps) {
  return (
    <>
      <h3 className="font-sans text-xl text-blue-600 font-light mb-2 mt-6">
        {title}
      </h3>
      <div className="pt-2">{children}</div>
    </>
  );
}
