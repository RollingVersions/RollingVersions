import * as React from 'react';
import {MemoryRouter, useRouteMatch} from 'react-router-dom';

import DocsPage from '.';
import NavBar from '../NavBar';
import NavBarLink from '../NavBarLink';

export default {title: 'pages/DocsPage'};

const DocsPageDemo = () => {
  const match = useRouteMatch<{selected: string}>('/docs/:selected');
  const selected = match && match.params.selected;
  return (
    <DocsPage
      selected={
        selected === 'circle-ci'
          ? selected
          : selected === 'github-actions'
          ? selected
          : null
      }
      links={{
        'circle-ci': '/docs/circle-ci',
        'github-actions': '/docs/github-actions',
      }}
    />
  );
};
export const Default = () => {
  return (
    <MemoryRouter>
      <NavBar>
        <NavBarLink to="#">HOME</NavBarLink>
        <NavBarLink to="#">DOCS</NavBarLink>
        <NavBarLink to="#">PRICING</NavBarLink>
        <NavBarLink to="#">CONTACT</NavBarLink>
      </NavBar>
      <DocsPageDemo />
    </MemoryRouter>
  );
};
