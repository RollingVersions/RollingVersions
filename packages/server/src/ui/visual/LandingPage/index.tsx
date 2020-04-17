import React from 'react';
import NavBar from '../NavBar';
import HeroBar, {HeroBarFooter} from '../HeroBar';
import MarketingContent from '../MarketingContent';

export default function LandingPage() {
  return (
    <>
      <div className="pb-6 pt-16">
        <NavBar></NavBar>
      </div>
      <HeroBar />
      <div className="py-16">
        <MarketingContent />
      </div>
      <HeroBarFooter />
    </>
  );
}
