import * as React from 'react';
import PricingPage from './';
import {MemoryRouter} from 'react-router-dom';
import NavBar from '../NavBar';
import NavBarLink from '../NavBarLink';

export default {title: 'pages/PricingPage'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar>
        <NavBarLink to="#">HOME</NavBarLink>
        <NavBarLink to="#">DOCS</NavBarLink>
        <NavBarLink to="#">PRICING</NavBarLink>
        <NavBarLink to="#">CONTACT</NavBarLink>
      </NavBar>
      <PricingPage />
    </MemoryRouter>
  );
};
