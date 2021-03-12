import React from 'react';

import ContactsPage from '../visual/ContactsPage';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';

export default function Contact() {
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <ContactsPage />
    </>
  );
}
