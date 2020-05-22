import React from 'react';
import {Link} from 'react-router-dom';

export interface NavBarLinkProps {
  to: string;
  children: string;
}
export default function NavBarLink({children, to}: NavBarLinkProps) {
  return (
    <Link
      to={to}
      className="font-heading italic text-orange-500 focus:outline-none focus:shadow-orange"
    >
      {children}
    </Link>
  );
}
