import React from 'react';
import {Instruction} from './docsFormats';

function Radio({isSelected}: {isSelected: boolean}) {
  return (
    <div className="flex justify-center items-center border border-solid border-gray-800 border-6 rounded-full h-12 w-12">
      {!isSelected ? null : (
        <div className="bg-orange-500 border rounded-full h-8 w-8"></div>
      )}
    </div>
  );
}

// TODO This looks horrible! I have been trying to get rid of blue outline when focussed/active but haven't succeeded.  I've also been unable to position the indicators or anything else. Not getting to grips with flex or tailwind at all. This has meant that I've not been able to experiment with appearance/styles.
function SelectorButton({
  children,
  isSelected,
  onClick,
}: {
  children: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={
        'btn ' +
        (isSelected ? 'bg-gray-400 ' : 'bg-transparent hover:bg-gray-100 ') +
        'font-poppins text-2xl py-2 px-4 outline-none ' +
        (isSelected ? 'border-4 ' : 'border ') +
        'border-orange-500 ' +
        (isSelected ? '' : 'hover:border-orange-300')
      }
      onClick={() => onClick()}
    >
      <Radio isSelected={isSelected} />
      <p>{children}</p>
    </button>
  );
}

export type Options = '' | 'github' | 'circle';

export default function Selector({
  selected,
  setSelected,
}: {
  selected: Options;
  setSelected: (value: Options) => void;
}) {
  return (
    <>
      <Instruction>Select Continuous Integration Service</Instruction>

      <div className="grid grid-cols-2 col-gap-12">
        <SelectorButton
          isSelected={selected === 'github'}
          onClick={() => setSelected('github')}
        >
          Github Actions
        </SelectorButton>
        <SelectorButton
          isSelected={selected === 'circle'}
          onClick={() => setSelected('circle')}
        >
          Circle CI
        </SelectorButton>
      </div>
    </>
  );
}
