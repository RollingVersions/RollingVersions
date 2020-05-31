import React from 'react';
import HeroBar, {HeroBarFooter, InstallButton} from '../HeroBar';
import MarketingContent from '../MarketingContent';

export default function LandingPage() {
  return (
    <>
      <HeroBar callToAction={<InstallButton />}>
        <p>Add change sets to pull requests</p>
        <p>Automatically release with change logs</p>
      </HeroBar>
      <div className="py-8 xs:py-16">
        <MarketingContent />
      </div>
      <HeroBarFooter />
    </>
  );
}
