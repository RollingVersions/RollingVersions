import React from 'react';
import LandingPage from '../visual/LandingPage';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';

export default function Home() {
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <LandingPage />
    </>
  );
}
