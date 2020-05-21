import React from 'react';
import {Link} from 'react-router-dom';
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
  to,
  svgIcon,
}: {
  children: string;
  isSelected: boolean;
  to: string;
  svgIcon: React.ReactNode;
}) {
  return (
    <Link
      className={`flex flex-col items-center h-56 w-56 ${
        isSelected
          ? 'bg-gray-300 border-4 '
          : 'bg-transparent hover:bg-gray-100 border hover:border-orange-300 '
      } font-poppins text-4xl py-2 px-4 border-orange-500 focus:outline-none focus:shadow-orange`}
      to={to}
      onMouseUp={(e) => {
        e.currentTarget.blur();
      }}
    >
      {/* <div className="flex justify-end">
        <Radio isSelected={isSelected} />
      </div> */}
      <div className="flex items-center justify-center flex-grow h-0">
        <div className="h-12 w-12">{svgIcon}</div>
      </div>
      <p className="text-center flex-grow h-0">{children}</p>
    </Link>
  );
}

export type CIservice = 'github-actions' | 'circle-ci';

export default function Selector({
  selected,
  links,
}: {
  selected: CIservice | null;
  links: {[key in CIservice]: string};
}) {
  return (
    <>
      <Instruction className="mt-16">
        Select Continuous Integration Service
      </Instruction>

      <div className="my-16 flex justify-center">
        <div className="grid grid-cols-2 col-gap-12">
          <SelectorButton
            isSelected={selected === 'github-actions'}
            to={links['github-actions']}
            svgIcon={
              <GithubActionsIcon
                className={`fill-current ${
                  selected === 'github-actions'
                    ? `text-orange-500`
                    : `text-gray-700`
                }`}
              />
            }
          >
            GitHub Actions
          </SelectorButton>
          <SelectorButton
            isSelected={selected === 'circle-ci'}
            to={links['circle-ci']}
            svgIcon={
              <CircleCIicon
                className={`fill-current ${
                  selected === 'circle-ci' ? `text-orange-500` : `text-gray-900`
                }`}
              />
            }
          >
            Circle CI
          </SelectorButton>
        </div>
      </div>
    </>
  );
}
