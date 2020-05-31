import React from 'react';

export interface SaveChangeLogFooterProps {
  disabled: boolean;
  onClick: () => void;
}
export default function SaveChangeLogFooter({
  disabled,
  onClick,
}: SaveChangeLogFooterProps) {
  return (
    <div
      className="flex-shrink-0 px-6 h-24 w-full bg-white flex justify-end items-center lg:sticky bottom-0"
      style={{
        boxShadow:
          '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <SaveButton disabled={disabled} onClick={onClick} />
    </div>
  );
}

function SaveButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex items-center justify-center bg-black text-white italic font-poppins font-medium h-16 w-auto px-6 text-4xl rounded shadow-lg focus:outline-none focus:shadow-gray ${
        disabled ? ` opacity-50` : ``
      }`}
      onClick={async () => {
        if (disabled) return;
        onClick();
      }}
    >
      Save Changes
    </button>
  );
}
