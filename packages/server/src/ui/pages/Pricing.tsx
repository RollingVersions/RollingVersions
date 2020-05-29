import * as React from 'react';
import {useRouteMatch} from 'react-router-dom';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';
import PricingPage from '../visual/PricingPage';

export default function Docs() {
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/pricing">PRICING</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <PricingPage />
    </>
  );
}
