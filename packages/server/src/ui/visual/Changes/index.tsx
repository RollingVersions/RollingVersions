import React from 'react';

export interface ChangesProps {
  title: string;
  children: React.ReactNode;
}
export default function Changes({title, children}: ChangesProps) {
  return (
    <>
      <h3 className="font-sans text-xl text-blue-800 font-light mb-2 mt-6">
        {title}
      </h3>
      <div className="pt-2">{children}</div>
    </>
  );
}
