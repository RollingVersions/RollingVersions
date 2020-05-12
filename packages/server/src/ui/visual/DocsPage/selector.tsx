import React from 'react';
import {Instruction} from './docsFormats';
import SelectedRadio from '../../icons/selectedRadio.svg';
import OpenRadio from '../../icons/openRadio.svg';

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
      <img
        className="h-12 w-12"
        src={isSelected ? SelectedRadio : OpenRadio}
        alt={(isSelected ? 'Selected' : 'Not Selected') + ' Icon'}
      />
      <p>{children}</p>
    </button>
  );
}

export default function CircleCI({
  selected,
  setSelected,
}: {
  selected: string;
  setSelected: (value: string) => void;
}) {
  // TODO What is generic name for CircleCI and Github actions
  return (
    <>
      <Instruction>Select Workflow Manager</Instruction>

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
