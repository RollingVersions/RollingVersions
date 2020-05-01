import React from 'react';
import {Link} from 'react-router-dom';
import Logo from '../Logo';
import installIcon from '../HeroBar/install-icon.svg';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function AppNavBar({children}: NavBarProps) {
  return (
    <nav className="flex items-center text-2xl px-10 bg-white h-16 sticky top-0 z-50 overflow-x-auto">
      <Link className="flex-shrink-0" to="/">
        <Logo className="w-auto h-8" />
      </Link>
      {React.Children.map(children, (child) => {
        return (
          <>
            <img src={installIcon} className="w-auto h-4 mx-4" />
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
    return <span className="font-popins flex-shrink-0">{children}</span>;
  }
  return (
    <Link to={to} className="font-popins flex-shrink-0">
      {children}
    </Link>
  );
}
