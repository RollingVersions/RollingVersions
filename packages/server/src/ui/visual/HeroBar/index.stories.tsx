import * as React from 'react';
import HeroBar, {HeroBarFooter} from './';

export default {title: 'modules/HeroBar'};

export const Default = () => {
  return <HeroBar />;
};
export const Footer = () => {
  return <HeroBarFooter />;
};
