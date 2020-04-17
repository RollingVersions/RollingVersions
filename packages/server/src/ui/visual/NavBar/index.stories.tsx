import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';
import NavBar from './';
import NavBarLink from '../NavBarLink';

export default {title: 'modules/NavBar'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar>
        <NavBarLink to="#">HOME</NavBarLink>
        <NavBarLink to="#">DOCS</NavBarLink>
        <NavBarLink to="#">PRICING</NavBarLink>
        <NavBarLink to="#">CONTACT</NavBarLink>
      </NavBar>
    </MemoryRouter>
  );
};
