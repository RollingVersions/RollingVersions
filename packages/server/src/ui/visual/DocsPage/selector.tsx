import React from 'react';
import {Instruction, Details, InlineCode} from './docs';
import SelectedRadio from '../../icons/selectedRadio.svg';
import OpenRadio from '../../icons/openRadio.svg';

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
        (isSelected ? 'bg-gray-400 ' : 'bg-transparent ') +
        'hover:bg-gray-100 ' +
        'font-poppins text-2xl py-2 px-4 outline-none ' +
        (isSelected ? 'border-4 ' : 'border ') +
        'border-orange-500 hover:border-orange-300'
      }
      onClick={() => onClick()}
    >
      {/* <img
        className="h-12 w-12"
        src={!isSelected ? SelectedRadio : OpenRadio}
        alt={(isSelected ? 'Selected' : 'Not Selected') + ' Icon'}
      /> */}
      {/* <input type="radio" id="workflow-manager" checked={!isSelected}></input> */}
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

      <div className="grid grid-cols-2 col-gap-4">
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
