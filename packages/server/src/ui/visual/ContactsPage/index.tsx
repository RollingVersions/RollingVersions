import React from 'react';
import HeroBar, {HeroBarFooter} from '../HeroBar';
import Contacts from './contacts';

export default function ContactsPage() {
  return (
    <>
      <HeroBar>
        <p>We are here to help.</p>
      </HeroBar>
      <div className="py-8 xs:py-16 container mx-auto">
        <Contacts />
      </div>
      <HeroBarFooter />
    </>
  );
}
