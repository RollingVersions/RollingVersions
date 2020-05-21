import React from 'react';
import {Instruction} from './docsFormats';
import GithubActionsIcon from '../../icons/githubactions.svg';
import CircleCIicon from '../../icons/circleci.svg';

// function Radio({isSelected}: {isSelected: boolean}) {
//   return (
//     <div className="flex justify-center items-center border border-solid border-gray-800 border-6 rounded-full h-12 w-12">
//       {!isSelected ? null : (
//         <div className="bg-orange-500 border rounded-full h-8 w-8"></div>
//       )}
//     </div>
//   );
// }

// TODO This looks horrible! I have been trying to get rid of blue outline when focussed/active but haven't succeeded.  I've tried ' outline-none focus:shadow-outline' and the outline is more shadowy but there all the time.

function SelectorButton({
  children,
  isSelected,
  onClick,
  svgIcon,
}: {
  children: string;
  isSelected: boolean;
  onClick: () => void;
  svgIcon?: any;
}) {
  console.dir(svgIcon);
  return (
    <button
      className={`btn h-56 w-56 ${
        isSelected
          ? 'bg-gray-400 border-4 '
          : 'bg-transparent hover:bg-gray-100 border hover:border-orange-300 '
      } font-poppins text-4xl py-2 px-4 border-orange-500 focus:outline-none focus:shadow-orange`}
      onClick={() => onClick()}
    >
      {/* <div className="flex justify-end">
        <Radio isSelected={isSelected} />
      </div> */}
      <div className="flex flex-wrap justify-center">
        {!svgIcon ? null : (
          <div className="h-12 w-12">
            <svg className="fill-current text-gray-900">{CircleCIicon}</svg>
          </div>
        )}
        <p>{children}</p>
      </div>
    </button>
  );
}

export type CIservice = 'github-actions' | 'circle-ci';

export default function Selector({
  selected,
  setSelected,
}: {
  selected: CIservice | null;
  setSelected: (value: CIservice) => void;
}) {
  return (
    <>
      <Instruction>Select Continuous Integration Service</Instruction>

      <div className="grid grid-cols-2 col-gap-12">
        <SelectorButton
          isSelected={selected === 'github-actions'}
          onClick={() => setSelected('github-actions')}
          svgIcon={GithubActionsIcon}
        >
          Github Actions
        </SelectorButton>
        <SelectorButton
          isSelected={selected === 'circle-ci'}
          onClick={() => setSelected('circle-ci')}
          svgIcon={CircleCIicon}
        >
          Circle CI
        </SelectorButton>
      </div>
    </>
  );
}
