import React from 'react';

import Logo from '../Logo';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function NavBar({children}: NavBarProps) {
  return (
    <nav className="container mx-auto flex flex-col items-center justify-between lg:flex-row pb-4 sm:pb-6 pt-8 sm:pt-6">
      <Logo className="flex-grow-0 w-auto h-12 sm:h-14 max-w-full" />

      <div className="text-l xs:text-xl mt-6 lg:mt-0">
        {React.Children.map(children, (child, index) => {
          if (index !== 0) {
            return (
              <>
                <span className="font-poppins font-400">{' / '}</span>
                {child}
              </>
            );
          }
          return child;
        })}
      </div>
    </nav>
  );
}
