import React from 'react';
import {Link} from 'react-router-dom';

export default function ChangeBranchLink({
  currentBranch,
}: {
  currentBranch: string | null;
}) {
  return (
    <Link
      className="ml-2 text-sm text-gray-700"
      to={{
        search: `?change-branch=1${
          currentBranch ? `&branch=${encodeURIComponent(currentBranch)}` : ``
        }`,
      }}
    >
      (change branch)
    </Link>
  );
}
