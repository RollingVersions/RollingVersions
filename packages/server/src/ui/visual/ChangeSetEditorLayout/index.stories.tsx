import * as React from 'react';
import ChangeSetEditorLayout from './';

export default {title: 'modules/ChangeSetEditorLayout'};

const Box = ({children, className}: {children: string; className?: string}) => {
  return <div className={`bg-gray-100 ${className || ''}`}>{children}</div>;
};
export const Default = () => {
  return (
    <div className="w-full min-h-full bg-gray-300 p-2">
      <ChangeSetEditorLayout
        breaking={<Box className="h-16">Breaking Changes</Box>}
        feat={<Box className="h-48">New Feature</Box>}
        refactor={<Box className="h-16">Refactoring</Box>}
        fix={<Box className="h-56">Bug Fix</Box>}
        perf={<Box className="h-40">Performance Improvement</Box>}
      />
    </div>
  );
};
