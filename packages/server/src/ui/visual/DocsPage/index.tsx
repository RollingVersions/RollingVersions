import React from 'react';
import HeroBar, {HeroBarFooter} from '../HeroBar';
import Docs from './docs';
import {CIservice} from './selector';

export default function DocsPage({
  selected,
  links,
}: {
  selected: CIservice | null;
  links: {[key in CIservice]: string};
}) {
  return (
    <>
      <HeroBar>
        <p>Docs</p>
      </HeroBar>
      <div className="py-16 container mx-auto">
        <Docs selected={selected} links={links} />
      </div>
      <HeroBarFooter />
    </>
  );
}
