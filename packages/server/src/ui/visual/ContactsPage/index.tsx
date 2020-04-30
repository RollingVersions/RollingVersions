import React from 'react';
import NavBar from '../NavBar';
import HeroBar, {HeroBarFooter, HeroBarBanner} from '../HeroBar';
import Contacts from './contacts';

export default function LandingPage() {
  return (
    <>
      <div className="pb-6 pt-16">
        <NavBar></NavBar>
      </div>
      {/* Only display HeroBar and Footer on larger screens to avoid masses of scrolling when all that is wanted is contacts */}
      <div className="hidden md:block">
        <HeroBar />
      </div>
      <HeroBarBanner>
        We want you to love Rolling Versions and to use it on all your projects.
        So if you have any queries or suggestions then do contact us by clicking
        on one of the links below.
      </HeroBarBanner>
      <div className="py-16">
        <Contacts />
      </div>
      <div className="hidden lg:block">
        <HeroBarFooter />
      </div>
    </>
  );
}
