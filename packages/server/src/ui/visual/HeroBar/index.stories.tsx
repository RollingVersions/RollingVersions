import * as React from 'react';
import HeroBar, {HeroBarFooter, InstallButton} from './';

export default {title: 'modules/HeroBar'};

export const Default = () => {
  return (
    <HeroBar callToAction={<InstallButton />}>
      <p>Add change sets to pull requests</p>
      <p>Automatically release with change logs</p>
    </HeroBar>
  );
};
export const Footer = () => {
  return <HeroBarFooter />;
};
