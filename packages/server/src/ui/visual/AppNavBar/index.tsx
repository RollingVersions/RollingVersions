import React from 'react';
import {Link} from 'react-router-dom';

import InstallIcon from '../HeroBar/install-icon.svg';
import Logo from '../Logo';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function AppNavBar({children}: NavBarProps) {
  return (
    <nav className="flex flex-shrink-0 items-center text-2xl px-10 bg-white h-16 sticky top-0 z-50 overflow-x-auto">
      <Link
        className="flex-shrink-0 focus:outline-none focus:shadow-orange"
        to="/"
      >
        <Logo className="w-auto h-8" />
      </Link>
      {React.Children.map(children, (child) => {
        return (
          <>
            <div className="mx-4">
              <InstallIcon className="w-auto h-4" />
            </div>
            {child}
          </>
        );
      })}
    </nav>
  );
}

export interface AppNavBarLinkProps {
  to?: string;
  children: React.ReactNode;
}
export function AppNavBarLink({children, to}: AppNavBarLinkProps) {
  if (!to) {
    return (
      <span className="flex items-center font-popins flex-shrink-0">
        {children}
      </span>
    );
  }
  return (
    <Link
      to={to}
      className="flex items-center font-popins flex-shrink-0 focus:outline-none focus:shadow-orange"
    >
      {children}
    </Link>
  );
}
