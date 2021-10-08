import React, {useEffect, useState} from 'react';
import {LinkProps} from 'react-router-dom';
import {Link} from 'react-router-dom';

const OPEN_DURATION = 300;
const CLOSE_DURATION = 200;
type State = 'open' | 'closing' | 'closed' | 'opening' | 'pre-open';
function backgroundAnimation(state: Exclude<State, 'closed'>): string {
  switch (state) {
    case 'pre-open':
      return `ease-out duration-300 opacity-0`;
    case 'opening':
      return `ease-out duration-300 opacity-75`;
    case 'open':
      return `ease-in duration-200 opacity-75`;
    case 'closing':
      return `ease-in duration-200 opacity-0`;
  }
}
function dialogAnimation(state: Exclude<State, 'closed'>): string {
  switch (state) {
    case 'pre-open':
      return `ease-out duration-500 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95`;
    case 'opening':
      return `ease-out duration-500 opacity-100 translate-y-0 sm:scale-100`;
    case 'open':
      return `ease-in duration-200 opacity-100 translate-y-0 sm:scale-100`;
    case 'closing':
      return `ease-in duration-200 opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95`;
  }
}
export default function ChangeBranchDialog({
  children,
  currentBranch,
  open,
}: {
  children: React.ReactNode;
  currentBranch: string | null;
  open: boolean;
}) {
  const [state, setState] = useState<State>(open ? 'open' : 'closed');
  useEffect(() => {
    let cancelled = false;
    if (open) {
      switch (state) {
        case 'open':
          break;
        case 'opening':
          setTimeout(() => {
            if (!cancelled) setState('open');
          }, OPEN_DURATION);
          break;
        case 'closed':
        case 'closing':
          setState('pre-open');
          break;
        case 'pre-open':
          requestAnimationFrame(() => {
            if (!cancelled) setState('opening');
          });
          break;
      }
    } else {
      switch (state) {
        case 'open':
        case 'opening':
        case 'pre-open':
          setState('closing');
          break;
        case 'closed':
          break;
        case 'closing':
          setTimeout(() => {
            if (!cancelled) setState('closed');
          }, CLOSE_DURATION);
          break;
      }
    }
    return () => {
      cancelled = true;
    };
  }, [open, state]);

  if (state === 'closed') return null;
  return (
    <div
      className="fixed z-50 inset-0 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <Link
          to={{
            search: currentBranch
              ? `?branch=${encodeURIComponent(currentBranch)}`
              : ``,
          }}
          className={`fixed inset-0 bg-gray-500 transition-opacity ${backgroundAnimation(
            state,
          )}`}
          aria-hidden="true"
        ></Link>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-scrseen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div
          className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 ${dialogAnimation(
            state,
          )}`}
        >
          <div>
            <div className="mt-3 text-center sm:mt-5">
              <h3
                className="text-lg leading-6 font-medium text-gray-900"
                id="modal-title"
              >
                Choose a branch
              </h3>
            </div>
          </div>
          <ul className="mt-5 sm:mt-6">{children}</ul>
        </div>
      </div>
    </div>
  );
}

export function ChangeBranchButton({
  children,
  to,
}: {
  children: React.ReactNode;
  to: LinkProps['to'];
}) {
  return (
    <li className="mt-2">
      <Link
        to={to}
        className="inline-flex justify-center w-full rounded-md border shadow-sm px-4 py-2 border-indigo-600 text-base font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
      >
        {children}
      </Link>
    </li>
  );
}
