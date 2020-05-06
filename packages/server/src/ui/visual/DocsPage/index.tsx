import React from 'react';
import HeroBar, {HeroBarFooter} from '../HeroBar';
import Docs from './docs';

export default function DocsPage() {
  return (
    <>
      <HeroBar>
        <p>Docs</p>
      </HeroBar>
      <div className="py-16 container mx-auto">
        <Docs />
      </div>
      <HeroBarFooter />
    </>
  );
}
