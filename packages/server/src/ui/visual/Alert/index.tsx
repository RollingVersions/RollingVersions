import React from 'react';

export default function Alert({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`px-6 py-4 md:px-10 md:py-6 text-red-900 bg-red-200 rounded-lg border border-red-300 ${
        className || ''
      }`}
    >
      {children}
    </p>
  );
}
