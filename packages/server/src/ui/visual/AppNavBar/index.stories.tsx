import * as React from 'react';
import {MemoryRouter} from 'react-router-dom';

import AppNavBar, {AppNavBarLink} from '.';

export default {title: 'modules/AppNavBar'};

export const Default = () => {
  return (
    <MemoryRouter>
      <AppNavBar>
        <AppNavBarLink to="#">ForbesLindesay</AppNavBarLink>
        <AppNavBarLink to="#">atdatabases</AppNavBarLink>
        <AppNavBarLink>PR 100</AppNavBarLink>
      </AppNavBar>
    </MemoryRouter>
  );
};
