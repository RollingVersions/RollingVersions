import React from 'react';

export interface SaveChangeLogFooterProps {
  disabled: boolean;
  headSha: string;
  onClick: () => void;
}
export default function SaveChangeLogFooter({
  disabled,
  headSha,
  onClick,
}: SaveChangeLogFooterProps) {
  return (
    <div
      className="fixed left-0 right-0 bottom-0 w-full bg-white flex justify-end"
      style={{
        boxShadow:
          '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <button
        type="button"
        disabled={disabled}
        className={`${
          disabled ? `bg-gray-700` : `bg-blue-700 hover:bg-blue-800`
        } text-white font-bold py-4 px-8 mx-2 sm:mx-12 my-4 rounded-md w-full md:w-auto md:rounded-full`}
        onClick={async () => {
          if (disabled) return;
          onClick();
        }}
      >
        Save Changelog For {headSha.substr(0, 7)}
      </button>
    </div>
  );
}
