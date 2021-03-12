import * as React from 'react';
import {useRouteMatch} from 'react-router-dom';

import DocsPage from '../visual/DocsPage';
import NavBar from '../visual/NavBar';
import NavBarLink from '../visual/NavBarLink';

export default function Docs() {
  const match = useRouteMatch<{selected: string}>('/help/:selected');
  const selected = match && match.params.selected;
  return (
    <>
      <NavBar>
        <NavBarLink to="/">HOME</NavBarLink>
        <NavBarLink to="/help/github-actions">DOCS</NavBarLink>
        <NavBarLink to="/contact">CONTACT</NavBarLink>
      </NavBar>
      <DocsPage
        selected={
          selected === 'circle-ci'
            ? selected
            : selected === 'github-actions'
            ? selected
            : null
        }
        links={{
          'circle-ci': '/help/circle-ci',
          'github-actions': '/help/github-actions',
        }}
      />
    </>
  );
}
