import React from 'react';
import Logo from '../Logo';

export interface NavBarProps {
  children?: React.ReactNode;
}

export default function NavBar({children}: NavBarProps) {
  return (
    <nav className="container mx-auto flex flex-col items-center justify-between lg:flex-row lg:items-end pb-6 pt-16">
      <Logo className="w-auto h-40" />

      <div className="text-xl mt-12">
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
