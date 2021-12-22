import React from 'react';
import {LinkProps} from 'react-router-dom';
import {Link} from 'react-router-dom';

import ModalDialog, {ModalDialogProps} from '../ModalDialog';

export default function ModalDialogButtonList({
  title,
  children,
  open,
  closeLink,
}: ModalDialogProps) {
  return (
    <ModalDialog title={title} open={open} closeLink={closeLink}>
      <ul className="mt-5 sm:mt-6">{children}</ul>
    </ModalDialog>
  );
}

export function ModalDialogLinkButton({
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
