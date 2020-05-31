import React from 'react';
import Logo from '../Logo';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function NavBar({children}: NavBarProps) {
  return (
    <nav className="container mx-auto flex flex-col items-center justify-between lg:flex-row lg:items-end pb-4 sm:pb-6 pt-8 sm:pt-16">
      <Logo className="w-auto h-24 sm:h-40 max-w-full px-1 xs:px-0" />

      <div className="text-l xs:text-xl mt-8 xs:mt-10 sm:mt-12">
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
