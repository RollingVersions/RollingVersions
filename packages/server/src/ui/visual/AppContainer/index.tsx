import React from 'react';

export interface AppContainerProps {
  children: React.ReactNode;
}
export default function AppContainer({children}: AppContainerProps) {
  return <div className="flex flex-col min-h-full bg-gray-200">{children}</div>;
}
