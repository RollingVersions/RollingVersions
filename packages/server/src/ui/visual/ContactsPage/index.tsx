import React from 'react';
import HeroBar, {HeroBarFooter} from '../HeroBar';
import Contacts from './contacts';

export default function ContactsPage() {
  return (
    <>
      <HeroBar>
        <p>We are here to help.</p>
      </HeroBar>
      <div className="py-8 xs:py-16 container px-1 xs:px-0  mx-auto">
        <Contacts />
      </div>
      <HeroBarFooter />
    </>
  );
}
