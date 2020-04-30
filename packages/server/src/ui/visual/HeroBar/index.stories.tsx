import * as React from 'react';
import HeroBar, {HeroBarFooter} from './';
import {HeroBarBanner} from './';

export default {title: 'modules/HeroBar'};

export const Default = () => {
  return <HeroBar />;
};
export const Footer = () => {
  return <HeroBarFooter />;
};
export const Banner = ({children}: {children: string}) => {
  return <HeroBarBanner>{children}</HeroBarBanner>;
};
