import React from 'react';

export interface AppContainerProps {
  children: React.ReactNode;
}
export default function AppContainer({children}: AppContainerProps) {
  return <div className="min-h-full bg-gray-200">{children}</div>;
}
