import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import NavBar from '.';

export default {title: 'modules/NavBar'};

export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  );
};
