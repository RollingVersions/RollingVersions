import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import NavBarLink from '.';

export default {title: 'modules/NavBarLink'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBarLink to="/">HOME</NavBarLink>
    </MemoryRouter>
  );
};
