import React from 'react';
import {Link, LinkProps} from 'react-router-dom';

export default function ChangeBranchLink({to}: {to: LinkProps['to']}) {
  return (
    <Link className="ml-2 text-sm text-gray-700" to={to} replace>
      (change branch)
    </Link>
  );
}
